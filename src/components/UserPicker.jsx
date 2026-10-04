import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { API_BASE } from '../config';
import './Collab.css';

function UserPicker({ selected = [], onChange, placeholder = 'Search by name or #tag...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const q = query.trim().replace(/^#/, '');
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(q)}`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          const chosen = new Set(selected.map((p) => p.uid));
          setResults((Array.isArray(data) ? data : []).filter((p) => !chosen.has(p.uid)));
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, selected]);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const add = (person) => {
    onChange([...selected, person]);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const remove = (uid) => onChange(selected.filter((p) => p.uid !== uid));

  return (
    <div className="user-picker" ref={boxRef}>
      <input
        className="newtrip-input user-picker-input"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { if (results.length || query.trim().length >= 2) setOpen(true); }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && query.trim().length >= 2 && (
        <div className="user-picker-dropdown">
          {loading && <p className="user-picker-empty">Searching…</p>}
          {!loading && results.length === 0 && (
            <p className="user-picker-empty">No one found</p>
          )}
          {!loading && results.map((person) => (
            <button
              type="button"
              key={person.uid}
              className="user-result"
              onClick={() => add(person)}
            >
              <span className="user-result-avatar">
                {String(person.name || '?').charAt(0).toUpperCase()}
              </span>
              <span className="user-result-name">{person.name}</span>
              <span className="user-handle">{person.handle || (person.tag ? `#${person.tag}` : '')}</span>
            </button>
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <div className="user-chip-row">
          {selected.map((person) => (
            <span key={person.uid} className="user-chip">
              {person.name}
              <span className="user-handle">{person.handle || (person.tag ? `#${person.tag}` : '')}</span>
              <button type="button" onClick={() => remove(person.uid)} aria-label={`Remove ${person.name}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserPicker;

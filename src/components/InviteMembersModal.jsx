import { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { X, UserPlus, Crown, Mail, Check, Copy, Clock } from 'lucide-react';
import UserPicker from './UserPicker';
import { API_BASE } from '../config';
import './Collab.css';

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function InviteMembersModal({ isOpen, tripId, isAdmin, onClose }) {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [people, setPeople] = useState([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedToken, setCopiedToken] = useState('');

  useEffect(() => {
    if (!isOpen || !tripId) return;

    fetch(`${API_BASE}/api/trips/${tripId}/members`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => {});

    if (isAdmin) {
      fetch(`${API_BASE}/api/trips/${tripId}/invites`, { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => setInvites(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [isOpen, tripId, isAdmin]);

  if (!isOpen) return null;

  const postInvite = async (payload) => {
    const res = await fetch(`${API_BASE}/api/trips/${tripId}/invites`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not send that invite.');
    setInvites((prev) => [...prev.filter((i) => i.email !== data.email), data]);
    return data;
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    const emailValue = email.trim();
    if (!people.length && !emailValue) {
      setError('Search for a person or enter an email address.');
      return;
    }
    if (emailValue && !EMAIL_RE.test(emailValue)) {
      setError(`"${emailValue}" is not a valid email address.`);
      return;
    }

    setSending(true);
    try {
      const sent = [];
      for (const person of people) {
        const data = await postInvite({ tag: person.tag });
        sent.push(data.handle || person.handle || person.name);
      }
      if (emailValue) {
        const data = await postInvite({ email: emailValue });
        sent.push(data.handle || emailValue);
      }
      setPeople([]);
      setEmail('');
      setNotice(`Invite sent to ${sent.join(', ')}.`);
    } catch (err) {
      setError(err.message || 'Could not reach the server. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const copyLink = async (invite) => {
    try {
      await navigator.clipboard.writeText(invite.inviteUrl);
      setCopiedToken(invite.inviteUrl);
      setTimeout(() => setCopiedToken(''), 2000);
    } catch {
      setError('Copying failed — the link is ' + invite.inviteUrl);
    }
  };

  return (
    <div className="newtrip-modal-overlay" onClick={onClose}>
      <div className="newtrip-modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="newtrip-modal-header">
          <div>
            <h2 className="newtrip-modal-title">Trip Members</h2>
            <p className="newtrip-modal-subtitle">
              {isAdmin
                ? 'Search Voyago users by name or #tag — or send an email link'
                : 'Everyone planning this trip'}
            </p>
          </div>
          <button className="newtrip-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="newtrip-modal-body">
          {isAdmin && (
            <Form onSubmit={handleInvite}>
              <Form.Label className="newtrip-label">Invite Members</Form.Label>
              <UserPicker selected={people} onChange={setPeople} />

              <Form.Label className="newtrip-label" style={{ marginTop: 14 }}>Or invite by email</Form.Label>
              <div className="invite-add-row">
                <Form.Control
                  type="email"
                  className="newtrip-input"
                  placeholder="friend@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                />
                <button type="submit" className="invite-add-btn" disabled={sending}>
                  <UserPlus size={15} />
                  {sending ? 'Sending…' : 'Invite'}
                </button>
              </div>
              {error && <p className="newtrip-field-error">{error}</p>}
              {notice && <p className="invite-success">{notice}</p>}
            </Form>
          )}

          <p className="invite-section-label">Members ({members.length})</p>
          {members.length === 0 ? (
            <p className="invite-empty">No members loaded.</p>
          ) : (
            <div className="invite-list">
              {members.map((m) => (
                <div key={m.uid} className="invite-row">
                  <span className="td-info-member-avatar">{String(m.name).charAt(0).toUpperCase()}</span>
                  <div className="invite-row-main">
                    <span className="invite-row-email">
                      {m.name}
                      {m.handle && <span className="user-handle">{m.handle}</span>}
                      {m.isAdmin && <span className="td-info-admin-badge"><Crown size={10} /> Admin</span>}
                    </span>
                    <span className="invite-row-note"><Mail size={11} /> {m.email}</span>
                  </div>
                  <Check size={16} color="#10b981" />
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
            <>
              <p className="invite-section-label">Pending invites ({invites.length})</p>
              {invites.length === 0 ? (
                <p className="invite-empty">No invites waiting for a reply.</p>
              ) : (
                <div className="invite-list">
                  {invites.map((invite) => (
                    <div key={invite.inviteId} className="invite-row">
                      <Clock size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
                      <div className="invite-row-main">
                        <span className="invite-row-email">
                          {invite.name || invite.email}
                          {invite.handle && <span className="user-handle">{invite.handle}</span>}
                        </span>
                        <span className="invite-row-note">
                          {invite.existingUser
                            ? 'Has a Voyago account — invite is in their inbox'
                            : 'No account yet — send them the link'}
                        </span>
                      </div>
                      <button type="button" className="invite-copy-btn" onClick={() => copyLink(invite)}>
                        {copiedToken === invite.inviteUrl ? <Check size={13} /> : <Copy size={13} />}
                        {copiedToken === invite.inviteUrl ? 'Copied' : 'Copy link'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default InviteMembersModal;

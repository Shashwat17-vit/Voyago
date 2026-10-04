import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MapPin } from 'lucide-react';
import { API_BASE } from '../config';
import './Collab.css';

function InviteInbox() {
  const navigate = useNavigate();
  const [invites, setInvites] = useState([]);
  const [open, setOpen] = useState(false);
  const [busyToken, setBusyToken] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/invites/pending`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setInvites(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const respond = async (invite, action) => {
    setBusyToken(invite.token);
    try {
      const res = await fetch(`${API_BASE}/api/invites/${invite.token}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return;
      setInvites((prev) => prev.filter((i) => i.token !== invite.token));
      if (action === 'accept') {
        setOpen(false);
        navigate('/trips/details', { state: { tripId: invite.tripId } });
      }
    } finally {
      setBusyToken('');
    }
  };

  return (
    <>
      <button
        className="navbar-invites"
        onClick={() => setOpen((o) => !o)}
        title={invites.length ? `${invites.length} trip invite(s)` : 'No trip invites'}
      >
        <Bell size={18} />
        {invites.length > 0 && <span className="navbar-invites-count">{invites.length}</span>}
      </button>

      {open && (
        <>
          <div className="navbar-dropdown-overlay" onClick={() => setOpen(false)} />
          <div className="invite-inbox">
            <p className="invite-inbox-title">Trip Invites</p>
            {invites.length === 0 ? (
              <p className="invite-empty" style={{ padding: '0 10px 10px' }}>
                You have no pending invites.
              </p>
            ) : (
              invites.map((invite) => (
                <div key={invite.token} className="invite-inbox-item">
                  <span className="invite-inbox-trip">{invite.tripTitle}</span>
                  <span className="invite-inbox-meta">
                    <MapPin size={11} /> {invite.destination}
                  </span>
                  <span className="invite-inbox-meta">Invited by {invite.invitedBy}</span>
                  <div className="invite-inbox-actions">
                    <button
                      className="invite-accept-btn"
                      disabled={busyToken === invite.token}
                      onClick={() => respond(invite, 'accept')}
                    >
                      Accept
                    </button>
                    <button
                      className="invite-decline-btn"
                      disabled={busyToken === invite.token}
                      onClick={() => respond(invite, 'decline')}
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}

export default InviteInbox;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MapPin } from 'lucide-react';
import { useInvites } from '../context/InvitesContext';
import './Collab.css';

function InviteInbox() {
  const navigate = useNavigate();
  const { invites, respond } = useInvites();
  const [open, setOpen] = useState(false);
  const [busyToken, setBusyToken] = useState('');
  const [limitError, setLimitError] = useState('');

  const handle = async (invite, action) => {
    if (action === 'accept' && invite.canAccept === false) {
      setLimitError(invite.limitMessage || "You're already part of 3 trips. Delete one before you can accept.");
      return;
    }
    setBusyToken(invite.token);
    setLimitError('');
    try {
      await respond(invite.token, action);
      if (action === 'accept') {
        setOpen(false);
        navigate('/trips/details', { state: { tripId: invite.tripId } });
      }
    } catch {
      // Keep the inbox open so the user can retry.
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
            {limitError && <p className="invite-empty" style={{ padding: '0 10px 8px', color: '#b45309' }}>{limitError}</p>}
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
                      disabled={busyToken === invite.token || invite.canAccept === false}
                      title={invite.canAccept === false ? (invite.limitMessage || 'No trip slots left') : 'Accept'}
                      onClick={() => handle(invite, 'accept')}
                    >
                      Accept
                    </button>
                    <button
                      className="invite-decline-btn"
                      disabled={busyToken === invite.token}
                      onClick={() => handle(invite, 'decline')}
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

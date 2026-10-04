import { useState } from 'react';
import { MapPin, Calendar } from 'lucide-react';
import { useInvites } from '../context/InvitesContext';
import './Collab.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80';

function formatDateRange(start, end) {
  if (!start) return '';
  const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

function InvitesSection({ onAccepted }) {
  const { invites, respond } = useInvites();
  const [busyToken, setBusyToken] = useState('');
  const [limitError, setLimitError] = useState('');

  if (!invites.length) return null;

  const handle = async (invite, action) => {
    if (action === 'accept' && invite.canAccept === false) {
      setLimitError(invite.limitMessage || "You're already part of 3 trips. Delete one before you can accept.");
      return;
    }
    setBusyToken(invite.token);
    setLimitError('');
    try {
      await respond(invite.token, action);
      if (action === 'accept') onAccepted?.();
    } catch (err) {
      setLimitError(err.message || "You're already part of 3 trips. Delete one before you can accept.");
    } finally {
      setBusyToken('');
    }
  };

  return (
    <section className="adventures-section invites-section">
      <h2 className="adventures-title">Your Invites ({invites.length})</h2>
      {limitError && <p className="newtrip-field-error" style={{ margin: '0 0 12px' }}>{limitError}</p>}
      <div className="invite-banner-list">
        {invites.map((invite) => (
          <div key={invite.token} className="invite-banner">
            <div
              className="invite-banner-thumb"
              style={{ backgroundImage: `url(${invite.imageUrl || DEFAULT_IMAGE})` }}
            />
            <div className="invite-banner-copy">
              <h3 className="invite-banner-title">{invite.tripTitle}</h3>
              <p className="invite-banner-meta">
                <MapPin size={13} /> {invite.destination}
                {invite.startDate && (
                  <>
                    <span className="invite-banner-dot">·</span>
                    <Calendar size={13} /> {formatDateRange(invite.startDate, invite.endDate)}
                  </>
                )}
              </p>
              <p className="invite-banner-from">Invited by {invite.invitedBy}</p>
            </div>
            <div className="invite-banner-actions">
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
        ))}
      </div>
    </section>
  );
}

export default InvitesSection;

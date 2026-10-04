import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import { API_BASE } from '../config';
import { setPendingRedirect } from '../pendingRedirect';
import './Home.css';
import './NewTrip.css';
import '../components/Collab.css';

const defaultImage = 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80';

function formatDateRange(start, end) {
  if (!start) return '';
  const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

function InvitePage() {
  const navigate = useNavigate();
  const { token } = useParams();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/invites/${token}`, { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          // 403 also covers "signed in as the wrong account"
          const body = await res.json().catch(() => ({}));
          setNeedsLogin(true);
          setError(body.error || '');
          return null;
        }
        const body = await res.json();
        if (!res.ok) { setError(body.error || 'This invite link is not valid.'); return null; }
        return body;
      })
      .then((data) => { if (data) setInvite(data); })
      .catch(() => setError('Could not reach the server.'))
      .finally(() => setLoading(false));
  }, [token]);

  const respond = async (action) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/invites/${token}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Could not respond to this invite.');
        return;
      }
      if (action === 'accept') navigate('/trips/details', { state: { tripId: invite.tripId } });
      else navigate('/home');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const goAuth = (path) => {
    setPendingRedirect(`/invite/${token}`);
    navigate(path);
  };

  return (
    <div className="home-v2">
      {!needsLogin && <TopNavbar />}
      <div className="invite-page">
        <div className="invite-card">
          <div
            className="invite-card-image"
            style={{ backgroundImage: `url(${invite?.imageUrl || defaultImage})` }}
          />
          <div className="invite-card-body">
            {loading ? (
              <p className="invite-card-sub">Loading invite…</p>
            ) : needsLogin ? (
              <>
                <span className="invite-card-eyebrow">Trip Invite</span>
                <h2 className="invite-card-title">You're invited to plan a trip</h2>
                <p className="invite-card-sub">
                  {error || 'Sign in or create a Voyago account to see this invite and respond to it.'}
                </p>
                <div className="invite-card-actions">
                  <button className="invite-accept-btn" onClick={() => goAuth('/signup')}>Create account</button>
                  <button className="invite-decline-btn" onClick={() => goAuth('/login')}>Log in</button>
                </div>
                <p className="invite-card-note">
                  Use the email address the invite was sent to — the invite only unlocks for that account.
                </p>
              </>
            ) : !invite ? (
              <>
                <span className="invite-card-eyebrow">Trip Invite</span>
                <h2 className="invite-card-title">Invite unavailable</h2>
                <p className="invite-card-sub">{error || 'This invite link is not valid.'}</p>
                <div className="invite-card-actions">
                  <button className="invite-decline-btn" onClick={() => navigate('/home')}>Go home</button>
                </div>
              </>
            ) : invite.emailMatches === false ? (
              <>
                <span className="invite-card-eyebrow">Trip Invite</span>
                <h2 className="invite-card-title">{invite.tripTitle}</h2>
                <p className="invite-card-sub">
                  This invite was sent to <strong>{invite.email}</strong>, but you are signed in as{' '}
                  <strong>{invite.viewerEmail}</strong>.
                </p>
                <div className="invite-card-actions">
                  <button className="invite-decline-btn" onClick={() => goAuth('/login')}>
                    Log in as {invite.email}
                  </button>
                </div>
                <p className="invite-card-note">
                  Ask {invite.invitedBy} to resend the invite to {invite.viewerEmail} if you would rather use this account.
                </p>
              </>
            ) : invite.status !== 'PENDING' ? (
              <>
                <span className="invite-card-eyebrow">Trip Invite</span>
                <h2 className="invite-card-title">{invite.tripTitle}</h2>
                <p className="invite-card-sub">
                  You already {invite.status === 'ACCEPTED' ? 'accepted' : 'declined'} this invite.
                </p>
                <div className="invite-card-actions">
                  {invite.status === 'ACCEPTED' ? (
                    <button
                      className="invite-accept-btn"
                      onClick={() => navigate('/trips/details', { state: { tripId: invite.tripId } })}
                    >
                      Open trip
                    </button>
                  ) : (
                    <button className="invite-decline-btn" onClick={() => navigate('/home')}>Go home</button>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="invite-card-eyebrow">{invite.invitedBy} invited you</span>
                <h2 className="invite-card-title">{invite.tripTitle}</h2>
                <p className="invite-card-sub">
                  <MapPin size={13} /> {invite.destination}
                </p>
                {invite.startDate && (
                  <p className="invite-card-sub">
                    <Calendar size={13} /> {formatDateRange(invite.startDate, invite.endDate)}
                  </p>
                )}
                {invite.canAccept === false && (
                  <p className="newtrip-field-error">
                    {invite.limitMessage || "You're already part of 3 trips. Delete one before you can accept this invite."}
                  </p>
                )}
                {error && <p className="newtrip-field-error">{error}</p>}
                <div className="invite-card-actions">
                  <button
                    className="invite-accept-btn"
                    disabled={busy || invite.canAccept === false}
                    onClick={() => respond('accept')}
                  >
                    {busy ? 'Working…' : 'Accept invite'}
                  </button>
                  <button className="invite-decline-btn" disabled={busy} onClick={() => respond('decline')}>
                    Deny
                  </button>
                </div>
                <p className="invite-card-note">
                  Accepting lets you view and edit the itinerary until the trip admin confirms it.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvitePage;

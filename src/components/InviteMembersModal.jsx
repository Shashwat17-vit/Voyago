import { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { X, UserPlus, Crown, Mail, Check, Copy, Clock } from 'lucide-react';
import { API_BASE } from '../config';
import './Collab.css';

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function InviteMembersModal({ isOpen, tripId, isAdmin, onClose }) {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
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

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    const value = email.trim();
    if (!value) {
      setError('Enter an email address to invite.');
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setError(`"${value}" is not a valid email address.`);
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/trips/${tripId}/invites`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not send that invite.');
        return;
      }
      setInvites((prev) => [...prev.filter((i) => i.email !== data.email), data]);
      setEmail('');
      setNotice(
        data.existingUser
          ? `${data.email} has a Voyago account — the invite is waiting in their inbox.`
          : `${data.email} has no Voyago account yet. Share the invite link so they can sign up and join.`
      );
    } catch {
      setError('Could not reach the server. Please try again.');
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
                ? 'Invite people by email — they can accept and edit the trip with you'
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
              <Form.Label className="newtrip-label">Invite by email</Form.Label>
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
                        <span className="invite-row-email">{invite.email}</span>
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

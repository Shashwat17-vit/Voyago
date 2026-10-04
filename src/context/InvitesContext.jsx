import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../config';

const InvitesContext = createContext({
  invites: [],
  refresh: () => {},
  respond: async () => null,
});

export function InvitesProvider({ children }) {
  const [invites, setInvites] = useState([]);

  const refresh = useCallback(() => {
    fetch(`${API_BASE}/api/invites/pending`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setInvites(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const respond = useCallback(async (token, action) => {
    const res = await fetch(`${API_BASE}/api/invites/${token}/${action}`, {
      method: 'POST',
      credentials: 'include',
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || 'Could not respond to this invite.');
    }
    setInvites((prev) => prev.filter((invite) => invite.token !== token));
    return body;
  }, []);

  return (
    <InvitesContext.Provider value={{ invites, refresh, respond }}>
      {children}
    </InvitesContext.Provider>
  );
}

export function useInvites() {
  return useContext(InvitesContext);
}

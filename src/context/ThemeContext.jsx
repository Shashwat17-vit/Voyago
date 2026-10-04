import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../config';
import { GUEST_USER, clearGuestFlag, isGuest } from '../guestSession';

const ThemeContext = createContext();

function toInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function userFromMe(data) {
  return {
    uid: data.uid ?? null,
    name: data.name || data.email || '',
    initials: toInitials(data.name || data.email || ''),
    email: data.email || '',
    tag: data.tag || '',
    handle: data.handle || (data.tag ? `#${data.tag}` : ''),
    isGuest: false,
    phone: '',
    bio: '',
    avatarUrl: '',
    tripCount: data.tripCount ?? 0,
    tripLimit: data.tripLimit ?? 3,
    canAddTrip: data.canAddTrip !== false,
  };
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null); // null = not yet loaded

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
      const data = res.ok ? await res.json() : null;
      if (data) {
        clearGuestFlag();
        setUser(userFromMe(data));
        return userFromMe(data);
      }
      if (isGuest()) {
        setUser(GUEST_USER);
        return GUEST_USER;
      }
      setUser(null);
      return null;
    } catch {
      if (isGuest()) {
        setUser(GUEST_USER);
        return GUEST_USER;
      }
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const becomeGuest = () => {
    setUser(GUEST_USER);
  };

  const [settings, setSettings] = useState({
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    emailNotifications: true,
    pushNotifications: true,
    tripReminders: true,
    groupUpdates: true,
    marketingEmails: false,
    profileVisibility: 'friends',
    showEmail: false,
    showTrips: true,
    twoFactorEnabled: false,
  });

  const toggleTheme = () =>
    setTheme((t) => (t === 'light' ? 'blue' : 'light'));
  const toggleSidebar = () => setSidebarOpen((o) => !o);

  const updateUser = (updates) =>
    setUser((prev) => {
      const next = { ...prev, ...updates };
      if (updates.name) next.initials = toInitials(updates.name);
      return next;
    });

  const updateSettings = (updates) =>
    setSettings((prev) => ({ ...prev, ...updates }));

  return (
    <ThemeContext.Provider value={{
      theme, setTheme, toggleTheme,
      sidebarOpen, toggleSidebar,
      user, updateUser, becomeGuest, refreshUser,
      settings, updateSettings,
    }}>
      <div data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
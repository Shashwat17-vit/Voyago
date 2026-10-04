// Guest flag + trip draft live in localStorage so they survive refresh, Back,
// and a second Voyago tab in this browser. End guest session / a successful
// signup flush clears both keys.
const GUEST_KEY = 'voyago:guest';
const DRAFT_KEY = 'voyago:guest-draft';

export const GUEST_USER = {
  uid: null,
  name: 'Guest',
  initials: 'G',
  email: '',
  tag: '',
  handle: '',
  isGuest: true,
  phone: '',
  bio: '',
  avatarUrl: '',
};

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked — guest mode will not survive a reload.
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function isGuest() {
  return read(GUEST_KEY) === '1';
}

export function enterGuest() {
  write(GUEST_KEY, '1');
}

export function clearGuestFlag() {
  remove(GUEST_KEY);
}

export function clearGuest() {
  remove(GUEST_KEY);
  remove(DRAFT_KEY);
}

export function getDraft() {
  const raw = read(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDraft(partial) {
  const next = { ...(getDraft() || {}), ...partial };
  write(DRAFT_KEY, JSON.stringify(next));
  return next;
}

export function takeDraft() {
  const draft = getDraft();
  remove(DRAFT_KEY);
  return draft;
}

export function keepDraft(draft) {
  if (draft) write(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft() {
  remove(DRAFT_KEY);
}

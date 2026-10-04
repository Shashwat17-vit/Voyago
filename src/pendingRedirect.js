// Remembers where to send the user once they finish signing in. OAuth logins bounce
// through the backend and always land on /home, so this has to survive a full page load.
// Browsers throw on sessionStorage access when site storage is blocked, and this runs on
// every Home mount, so a failure here must never break the page.
const KEY = 'voyago:redirect-to';

export function setPendingRedirect(path) {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Without storage the deep link is lost, but signing in still works.
  }
}

export function takePendingRedirect() {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return path;
  } catch {
    return null;
  }
}

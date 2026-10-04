import { API_BASE } from './config';
import { clearGuest, keepDraft, takeDraft } from './guestSession';

/**
 * Turns a guest draft into a real trip after the user signs in.
 * Returns { tripId } on success. On failure the draft is put back so Home can retry.
 */
export async function flushGuestDraft() {
  const draft = takeDraft();
  clearGuest();
  if (!draft?.destination && !draft?.title) return null;

  try {
    const tripRes = await fetch(`${API_BASE}/api/trips`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: draft.title,
        destination: draft.destination,
        startDate: draft.startDate,
        endDate: draft.endDate,
        numTravelers: draft.numTravelers || draft.numPeople,
      }),
    });
    const tripBody = await tripRes.json().catch(() => ({}));
    if (!tripRes.ok) throw new Error(tripBody.error || 'Could not create the trip from your draft.');
    const tripId = tripBody.tid;

    if (draft.tripType || draft.currentLocation || draft.interests?.length) {
      const prefsRes = await fetch(`${API_BASE}/api/trips/${tripId}/preferences`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLocation: draft.currentLocation || '',
          tripType: draft.tripType || '',
          accommodation: draft.accommodation || '',
          transportation: draft.transport || '',
          interests: Array.isArray(draft.interests) ? draft.interests.join(', ') : (draft.interests || ''),
          notes: draft.notes || '',
        }),
      });
      if (!prefsRes.ok) {
        const err = await prefsRes.json().catch(() => ({}));
        throw new Error(err.error || 'Trip created, but preferences failed. Open the trip to finish.');
      }
    }

    const emails = (draft.inviteEmails || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    for (const email of emails) {
      await fetch(`${API_BASE}/api/trips/${tripId}/invites`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {});
    }

    if (draft.tripType || (Array.isArray(draft.interests) && draft.interests.length >= 3)) {
      await fetch(`${API_BASE}/api/trips/${tripId}/generate`, {
        method: 'POST',
        credentials: 'include',
      });
    }

    return { tripId };
  } catch (err) {
    keepDraft(draft);
    throw err;
  }
}

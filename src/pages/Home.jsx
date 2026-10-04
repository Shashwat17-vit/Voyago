import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavbar from '../components/TopNavbar';
import HeroSection from '../components/HeroSection';
import InvitesSection from '../components/InvitesSection';
import AdventuresSection from '../components/AdventuresSection';
import NewTripModal from '../components/NewTripModal';
import { API_BASE } from '../config';
import { takePendingRedirect } from '../pendingRedirect';
import { clearDraft, getDraft, isGuest } from '../guestSession';
import { flushGuestDraft } from '../flushGuestDraft';
import './Home.css';
import './NewTrip.css';

function draftAsTrip(draft) {
  if (!draft?.title && !draft?.destination) return null;
  return {
    tid: 'draft',
    title: draft.title || 'Untitled trip',
    destination: draft.destination || '',
    startDate: draft.startDate || '',
    endDate: draft.endDate || '',
    numTravelers: Number(draft.numTravelers || draft.numPeople || 1),
    confirmed: false,
    isAdmin: true,
    isDraft: true,
    imageUrl: '',
  };
}

function Home() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [newTripOpen, setNewTripOpen] = useState(false);
  const [newTripData, setNewTripData] = useState(null);
  const [flushError, setFlushError] = useState('');

  useEffect(() => {
    const pending = takePendingRedirect();
    if (pending && pending !== '/home') navigate(pending, { replace: true });
  }, [navigate]);

  const showGuestDraft = useCallback(() => {
    const card = draftAsTrip(getDraft());
    setTrips(card ? [card] : []);
  }, []);

  const loadTrips = useCallback(() => {
    if (isGuest()) {
      showGuestDraft();
      return;
    }
    fetch(`${API_BASE}/api/trips`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setTrips(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [showGuestDraft]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const me = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null);

      if (me && getDraft()) {
        try {
          const flushed = await flushGuestDraft();
          if (cancelled) return;
          if (flushed?.tripId) {
            navigate('/trips/details', { state: { tripId: flushed.tripId }, replace: true });
            return;
          }
        } catch (err) {
          if (!cancelled) setFlushError(err.message || 'Could not finish your draft trip.');
        }
      }
      if (!cancelled) loadTrips();
    }
    boot();
    return () => { cancelled = true; };
  }, [loadTrips, navigate]);

  const handleTripClick = (trip) => {
    if (trip.isDraft) {
      setNewTripData(trip);
      setNewTripOpen(true);
      return;
    }
    navigate('/trips/details', { state: { tripId: trip.tid } });
  };

  const handleDeleteTrip = async (tripId) => {
    if (tripId === 'draft') {
      clearDraft();
      setTrips([]);
      return;
    }
    await fetch(`${API_BASE}/api/trips/${tripId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    setTrips((prev) => prev.filter((t) => t.tid !== tripId));
  };

  const handleStartPlan = (data) => {
    setNewTripData(data);
    setNewTripOpen(true);
  };

  return (
    <div className="home-v2">
      <TopNavbar />
      <HeroSection onStartPlan={handleStartPlan} />
      {flushError && (
        <p className="newtrip-field-error" style={{ textAlign: 'center', padding: '0 5%' }}>{flushError}</p>
      )}
      {!isGuest() && <InvitesSection onAccepted={loadTrips} />}
      <AdventuresSection trips={trips} onTripClick={handleTripClick} onDeleteTrip={handleDeleteTrip} />

      <NewTripModal
        isOpen={newTripOpen}
        onClose={() => setNewTripOpen(false)}
        initialData={newTripData}
        onDraftSaved={showGuestDraft}
        onTripCreated={(newTrip) => setTrips(prev => [...prev, newTrip])}
      />
    </div>
  );
}

export default Home;

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavbar from '../components/TopNavbar';
import HeroSection from '../components/HeroSection';
import InvitesSection from '../components/InvitesSection';
import AdventuresSection from '../components/AdventuresSection';
import NewTripModal from '../components/NewTripModal';
import { API_BASE } from '../config';
import { takePendingRedirect } from '../pendingRedirect';
import './Home.css';
import './NewTrip.css';

function Home() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [newTripOpen, setNewTripOpen] = useState(false);
  const [newTripData, setNewTripData] = useState(null);

  // OAuth sign-in always lands here, so finish any deep link the user started from.
  useEffect(() => {
    const pending = takePendingRedirect();
    if (pending) navigate(pending, { replace: true });
  }, [navigate]);

  const loadTrips = useCallback(() => {
    fetch(`${API_BASE}/api/trips`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setTrips(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleTripClick = (trip) => {
    navigate('/trips/details', { state: { tripId: trip.tid } });
  };

  const handleDeleteTrip = async (tripId) => {
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
      <InvitesSection onAccepted={loadTrips} />
      <AdventuresSection trips={trips} onTripClick={handleTripClick} onDeleteTrip={handleDeleteTrip} />

      <NewTripModal
        isOpen={newTripOpen}
        onClose={() => setNewTripOpen(false)}
        initialData={newTripData}
        onTripCreated={(newTrip) => setTrips(prev => [...prev, newTrip])}
      />
    </div>
  );
}

export default Home;

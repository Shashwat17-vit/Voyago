import { useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Users, PlusCircle, ArrowLeft, Trash2 } from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import NewTripModal from '../components/NewTripModal';
import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { clearDraft, getDraft, isGuest } from '../guestSession';
import './Home.css';
import './NewTrip.css';

function TripOverview() {
  const navigate = useNavigate();
  const [newTripOpen, setNewTripOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest()) {
      const draft = getDraft();
      setTrips(draft?.title || draft?.destination ? [{
        tid: 'draft',
        title: draft.title || 'Untitled trip',
        destination: draft.destination || '',
        startDate: draft.startDate || '',
        endDate: draft.endDate || '',
        numTravelers: Number(draft.numTravelers || draft.numPeople || 1),
        confirmed: false,
        isAdmin: true,
        isDraft: true,
      }] : []);
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/trips`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => { setTrips(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleTripClick = (trip) => {
    if (trip.isDraft) {
      setNewTripOpen(true);
      return;
    }
    navigate('/trips/details', { state: { tripId: trip.tid } });
  };

  const handleDeleteTrip = async (tripId) => {
    if (tripId === 'draft') {
      clearDraft();
      setTrips([]);
      setConfirmDeleteId(null);
      return;
    }
    await fetch(`${API_BASE}/api/trips/${tripId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    setTrips((prev) => prev.filter((t) => t.tid !== tripId));
    setConfirmDeleteId(null);
  };

  const formatDates = (start, end) => {
    if (!start) return '';
    const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
  };

  return (
    <div className="home-v2">
      <TopNavbar />

      <Container className="py-4" style={{ maxWidth: 1200 }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <button className="tripdetails-back" onClick={() => navigate('/home')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="newtrip-title" style={{ marginBottom: 0 }}>Your Trips</h2>
            <p className="newtrip-subtitle" style={{ marginBottom: 0 }}>Trips currently being planned</p>
          </div>
        </div>

        {loading ? (
          <p className="text-center" style={{ color: '#aaa' }}>Loading trips...</p>
        ) : (
          <Row className="g-4">
            {trips.map((trip) => (
              <Col sm={6} lg={4} key={trip.tid}>
                <div className="trip-card" style={{ cursor: 'pointer' }}>
                  <div
                    className="trip-card-image"
                    style={{ backgroundImage: `url(${trip.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80'})` }}
                    onClick={() => handleTripClick(trip)}
                  >
                    <span className={`trip-badge ${trip.isDraft || !trip.confirmed ? 'badge-inplanning' : 'badge-active'}`}>
                      {trip.isDraft ? 'Draft' : trip.confirmed ? 'Confirmed' : 'Planning'}
                    </span>
                    {!trip.isAdmin && (
                      <span className="trip-badge trip-badge-shared">Shared with you</span>
                    )}
                  </div>
                  <div className="trip-card-body" onClick={() => handleTripClick(trip)}>
                    <h3 className="trip-card-title">{trip.title}</h3>
                    <p className="trip-card-dates">{formatDates(trip.startDate, trip.endDate)}</p>
                    <div className="trip-card-footer">
                      <span className="trip-members">
                        <Users size={16} />
                        {trip.numTravelers} {trip.numTravelers === 1 ? 'traveler' : 'travelers'}
                      </span>
                      <div className="trip-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="trip-view-btn" onClick={() => handleTripClick(trip)}>View</button>
                        {trip.isAdmin && (confirmDeleteId === trip.tid ? (
                          <>
                            <button className="trip-delete-confirm-btn" onClick={() => handleDeleteTrip(trip.tid)}>Yes, delete</button>
                            <button className="trip-delete-cancel-btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className="trip-delete-btn" onClick={() => setConfirmDeleteId(trip.tid)} title="Delete trip">
                            <Trash2 size={14} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            ))}

            <Col sm={6} lg={4}>
              <button className="trip-card add-trip-card" onClick={() => setNewTripOpen(true)} aria-label="Plan a new trip">
                <div className="add-trip-content">
                  <div className="add-trip-icon">
                    <PlusCircle size={40} strokeWidth={1.5} />
                  </div>
                  <h3 className="add-trip-label">Plan a New Trip</h3>
                  <p className="add-trip-hint">Start planning your next adventure</p>
                </div>
              </button>
            </Col>
          </Row>
        )}
      </Container>

      <NewTripModal
        isOpen={newTripOpen}
        onClose={() => { setNewTripOpen(false); }}
        onTripCreated={(newTrip) => setTrips(prev => [...prev, newTrip])}
      />
    </div>
  );
}

export default TripOverview;

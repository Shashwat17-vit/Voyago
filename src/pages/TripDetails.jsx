import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Row, Col, Nav } from 'react-bootstrap';
import {
  Calendar, MapPin, Settings,
  UserPlus, Pencil, ChevronLeft, X, Crown, Mail, Users, Trash2,
} from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import AvatarGroup from '../components/AvatarGroup';
import ItineraryCalendar from '../components/ItineraryCalendar';
import TripMap from '../components/TripMap';
import TripSettings from '../components/TripSettings';
import { API_BASE } from '../config';
import './Home.css';
import './NewTrip.css';

const defaultImage = 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80';

const sidebarNav = [
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'map',      label: 'Map',      icon: MapPin },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function formatDateRange(start, end) {
  if (!start) return '';
  const fmt = (d) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };
  const s = new Date(start + 'T00:00:00');
  const e = end ? new Date(end + 'T00:00:00') : null;
  const nights = e ? Math.round((e - s) / 86400000) : 0;
  const range = end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
  return nights > 0 ? `${range} (${nights} nights)` : range;
}

function TripDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const tripId = location.state?.tripId;

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('calendar');
  const [showTripInfo, setShowTripInfo] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!tripId) { setLoading(false); return; }
    fetch(`${API_BASE}/api/trips/${tripId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => { setTrip(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tripId]);

  if (loading) return <div className="home-v2"><TopNavbar /><p style={{ color: '#aaa', padding: 40 }}>Loading...</p></div>;
  if (!trip) return <div className="home-v2"><TopNavbar /><p style={{ color: '#aaa', padding: 40 }}>Trip not found.</p></div>;

  const tripTitle   = trip.title       || 'My Trip';
  const destination = trip.destination || '';
  const tripImage   = trip.imageUrl    || defaultImage;
  const dateRange   = formatDateRange(trip.startDate, trip.endDate);
  const guestCount  = trip.numTravelers || 1;
  const members     = [{ name: 'You', color: '#3b82f6' }];

  return (
    <div className="home-v2">
      <TopNavbar />

      <Row className="tripdetails-page g-3">
        <Col lg={3}>
          <aside className="td-sidebar">
            <div className="td-sidebar-card">
              <div className="td-sidebar-image" style={{ backgroundImage: `url(${tripImage})` }}>
                <button className="td-sidebar-edit-btn" onClick={() => setShowTripInfo(true)}>
                  <Pencil size={14} />
                </button>
              </div>

              {showTripInfo && (
                <div className="td-info-overlay" onClick={() => setShowTripInfo(false)}>
                  <div className="td-info-popup" onClick={(e) => e.stopPropagation()}>
                    <div className="td-info-header">
                      <h3 className="td-info-title">Trip Details</h3>
                      <button className="td-info-close" onClick={() => setShowTripInfo(false)}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className="td-info-body">
                      <div className="td-info-row">
                        <span className="td-info-label">Trip Name</span>
                        <span className="td-info-value">{tripTitle}</span>
                      </div>
                      <div className="td-info-row">
                        <span className="td-info-label"><MapPin size={14} /> Destination</span>
                        <span className="td-info-value">{destination}</span>
                      </div>
                      {dateRange && (
                        <div className="td-info-row">
                          <span className="td-info-label"><Calendar size={14} /> Dates</span>
                          <span className="td-info-value">{dateRange}</span>
                        </div>
                      )}
                      <div className="td-info-row">
                        <span className="td-info-label"><Users size={14} /> Travelers</span>
                        <span className="td-info-value">{guestCount} people</span>
                      </div>
                      <div className="td-info-divider" />
                      <h4 className="td-info-section-title">Members</h4>
                      <div className="td-info-members">
                        {members.map((m, i) => (
                          <div key={i} className="td-info-member">
                            <span className="td-info-member-avatar" style={{ background: m.color }}>
                              {m.name.charAt(0).toUpperCase()}
                            </span>
                            <div className="td-info-member-details">
                              <span className="td-info-member-name">
                                {m.name}
                                {i === 0 && <span className="td-info-admin-badge"><Crown size={10} /> Admin</span>}
                              </span>
                              <span className="td-info-member-email"><Mail size={11} /> {m.email || ''}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="td-sidebar-info">
                <h3 className="td-sidebar-title">{tripTitle}</h3>
                {dateRange && (
                  <p className="td-sidebar-meta"><Calendar size={14} />{dateRange}</p>
                )}
                <p className="td-sidebar-meta"><MapPin size={14} />{destination}</p>
                <div className="td-sidebar-members">
                  <AvatarGroup members={members} max={4} size={32} />
                  <span className="td-sidebar-guest-count">{guestCount} guests</span>
                </div>
                <button className="td-sidebar-invite"><UserPlus size={16} />Invite Guests</button>
              </div>
            </div>

            <Nav className="td-sidebar-nav flex-lg-column flex-row">
              {sidebarNav.map(({ id, label, icon: Icon }) => (
                <Nav.Item key={id}>
                  <button
                    className={`td-sidebar-nav-item ${activeNav === id ? 'active' : ''}`}
                    onClick={() => setActiveNav(id)}
                  >
                    <Icon size={18} />{label}
                  </button>
                </Nav.Item>
              ))}
            </Nav>
          </aside>
        </Col>

        <Col lg={9}>
          <div className="td-main">
            <div className="td-main-topbar">
              <button className="tripdetails-back" onClick={() => navigate('/trips')}>
                <ChevronLeft size={18} />Back to Trips
              </button>
              <div className="td-delete-wrap">
                {!confirmDelete ? (
                  <button className="td-delete-btn" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={15} /> Delete Trip
                  </button>
                ) : (
                  <>
                    <span className="td-delete-label">Delete this trip?</span>
                    <button
                      className="td-delete-confirm-btn"
                      disabled={deleting}
                      onClick={async () => {
                        setDeleting(true);
                        await fetch(`${API_BASE}/api/trips/${tripId}`, {
                          method: 'DELETE',
                          credentials: 'include',
                        });
                        navigate('/trips');
                      }}
                    >
                      {deleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button className="td-delete-cancel-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
                  </>
                )}
              </div>
            </div>

            {activeNav === 'calendar' && (
              <ItineraryCalendar tripId={tripId} tripTitle={tripTitle} destination={destination} />
            )}
            {activeNav === 'map' && <TripMap destination={destination} />}
            {activeNav === 'settings' && (
              <TripSettings
                tripData={{ ...trip, tripId }}
                onRegenerate={(updated) => {
                  navigate('/trips/details', { state: updated, replace: true });
                  setActiveNav('calendar');
                }}
              />
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default TripDetails;

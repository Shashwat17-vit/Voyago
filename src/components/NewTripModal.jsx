import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { X, ArrowRight, ArrowLeft, Star } from 'lucide-react';
import PlaceAutocomplete from './PlaceAutocomplete';
import { API_BASE } from '../config';

const interestOptions = [
  'Museums', 'Food & Dining', 'Adventure', 'Nightlife',
  'Nature & Hiking', 'Shopping', 'History', 'Beach',
  'Photography', 'Local Culture',
];

function NewTripModal({ isOpen, onClose, initialData }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [numPeople, setNumPeople] = useState('');
  const [groupOption, setGroupOption] = useState('individual');
  const [groupName, setGroupName] = useState('');
  const [inviteEmails, setInviteEmails] = useState('');
  const [step1Error, setStep1Error] = useState('');

  const [currentLocation, setCurrentLocation] = useState('');
  const [tripType, setTripType] = useState('');
  const [accommodation, setAccommodation] = useState('');
  const [transport, setTransport] = useState('');
  const [interests, setInterests] = useState([]);
  const [interestError, setInterestError] = useState('');
  const [notes, setNotes] = useState('');
  const [tripId, setTripId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  useEffect(() => {
    if (initialData) {
      if (initialData.destination) setDestination(initialData.destination);
      if (initialData.startDate) setStartDate(initialData.startDate);
    }
  }, [initialData]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStep(1);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleInterest = (interest) => {
    setInterests((prev) => {
      const next = prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest];
      if (next.length >= 3) setInterestError('');
      return next;
    });
  };

  const fetchDestinationImage = async (dest) => {
    const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    if (!key) {
      console.warn('VITE_UNSPLASH_ACCESS_KEY not set — restart Vite after adding .env');
      return null;
    }
    try {
      const res = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(dest)}&orientation=landscape&content_filter=high&client_id=${key}`
      );
      if (!res.ok) {
        console.error('Unsplash API error:', res.status, await res.text());
        return null;
      }
      const data = await res.json();
      return data?.urls?.regular || null;
    } catch (err) {
      console.error('Unsplash fetch failed:', err);
      return null;
    }
  };

  const handleStep1Next = async (e) => {
    e.preventDefault();
    setStep1Error('');
    try {
      const imageUrl = await fetchDestinationImage(destination);

      const res = await fetch(`${API_BASE}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, destination, startDate, endDate, numTravelers: numPeople, imageUrl }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStep1Error(err.error || 'Failed to create trip. Please try again.');
        return;
      }
      const data = await res.json();
      setTripId(data.tid);
      setStep(2);
    } catch (e) {
      setStep1Error('Could not reach the server. Please check your connection.');
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (interests.length < 3) {
      setInterestError('Please select at least 3 interests');
      return;
    }
    setInterestError('');
    setGenError('');
    setGenerating(true);

    try {
      // Step 1: Save preferences
      const prefRes = await fetch(`${API_BASE}/api/trips/${tripId}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentLocation,
          tripType,
          accommodation,
          transportation: transport,
          interests: interests.join(', '),
          notes,
        }),
      });
      if (!prefRes.ok) {
        const err = await prefRes.json();
        setGenError(err.error || 'Failed to save preferences');
        return;
      }

      // Step 2: Generate itinerary via LLM (this calls Python agent, may take ~20s)
      const genRes = await fetch(`${API_BASE}/api/trips/${tripId}/generate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!genRes.ok) {
        const err = await genRes.json();
        setGenError(err.error || 'Itinerary generation failed');
        return;
      }

      onClose();
      navigate('/trips/details', { state: { tripId } });
    } catch (err) {
      setGenError('Could not reach the server: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="newtrip-modal-overlay" onClick={onClose}>
      <div className="newtrip-modal" onClick={(e) => e.stopPropagation()}>
        <div className="newtrip-modal-header">
          <div>
            <h2 className="newtrip-modal-title">
              {step === 1 ? 'Create a New Trip' : 'Trip Preferences'}
            </h2>
            <p className="newtrip-modal-subtitle">
              {step === 1
                ? 'Start by filling in the basics'
                : `Tell us more about "${title || 'your trip'}" so we can plan it`}
            </p>
          </div>
          <div className="newtrip-modal-header-right">
            <span className="newtrip-step-indicator">Step {step} of 2</span>
            <button className="newtrip-modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="newtrip-modal-body">
          {step === 1 && (
            <Form onSubmit={handleStep1Next} className="newtrip-form">
              {step1Error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{step1Error}</div>}
              <Form.Group className="mb-3">
                <Form.Label className="newtrip-label">Trip Title</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Summer in Europe"
                  className="newtrip-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="newtrip-label">Destination</Form.Label>
                <PlaceAutocomplete
                  value={destination}
                  onChange={setDestination}
                  placeholder="e.g. Paris, France"
                  className="newtrip-input"
                  required
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="newtrip-label">Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      className="newtrip-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="newtrip-label">End Date</Form.Label>
                    <Form.Control
                      type="date"
                      className="newtrip-input"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || undefined}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="newtrip-label">Number of People</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  placeholder="How many travelers?"
                  className="newtrip-input"
                  value={numPeople}
                  onChange={(e) => setNumPeople(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="newtrip-label">Travel With</Form.Label>
                <div className="group-toggle">
                  <button
                    type="button"
                    className={`group-toggle-btn ${groupOption === 'individual' ? 'active' : ''}`}
                    onClick={() => setGroupOption('individual')}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    className={`group-toggle-btn ${groupOption === 'group' ? 'active' : ''}`}
                    onClick={() => setGroupOption('group')}
                  >
                    Add to Group
                  </button>
                </div>
              </Form.Group>

              {groupOption === 'group' && (
                <Form.Group className="mb-3">
                  <Form.Label className="newtrip-label">Group Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. College Friends"
                    className="newtrip-input"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label className="newtrip-label">Invite Members (emails, comma-separated)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="friend1@email.com, friend2@email.com"
                  className="newtrip-input newtrip-textarea"
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                />
              </Form.Group>

              <Button type="submit" variant="outline-light" className="newtrip-submit w-100">
                Next: Trip Preferences
                <ArrowRight size={18} style={{ marginLeft: '8px' }} />
              </Button>
            </Form>
          )}

          {step === 2 && (
            <Form onSubmit={handleGenerate} className="newtrip-form">
              {startDate && endDate && (
                <div className="proposed-dates-bar">
                  <span className="proposed-dates-label">Trip dates:</span>
                  <span className="proposed-dates-value">{startDate} to {endDate}</span>
                </div>
              )}

              <Form.Group className="mb-3">
                <Form.Label className="newtrip-label">Your Current Location <span className="newtrip-required">*</span></Form.Label>
                <PlaceAutocomplete
                  value={currentLocation}
                  onChange={setCurrentLocation}
                  placeholder="e.g. New York, USA"
                  className="newtrip-input"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="newtrip-label">Trip Type <span className="newtrip-required">*</span></Form.Label>
                <Form.Select
                  className="newtrip-input newtrip-select"
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value)}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="adventure">Adventure</option>
                  <option value="relaxation">Relaxation</option>
                  <option value="cultural">Cultural</option>
                  <option value="road-trip">Road Trip</option>
                  <option value="business">Business</option>
                </Form.Select>
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="newtrip-label">Accommodation <span className="newtrip-required">*</span></Form.Label>
                    <Form.Select
                      className="newtrip-input newtrip-select"
                      value={accommodation}
                      onChange={(e) => setAccommodation(e.target.value)}
                      required
                    >
                      <option value="">Select preference...</option>
                      <option value="hotel">Hotel</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="hostel">Hostel</option>
                      <option value="resort">Resort</option>
                      <option value="camping">Camping</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="newtrip-label">Transportation <span className="newtrip-required">*</span></Form.Label>
                    <Form.Select
                      className="newtrip-input newtrip-select"
                      value={transport}
                      onChange={(e) => setTransport(e.target.value)}
                      required
                    >
                      <option value="">Select preference...</option>
                      <option value="flight">Flight</option>
                      <option value="train">Train</option>
                      <option value="car">Rental Car</option>
                      <option value="bus">Bus</option>
                      <option value="mixed">Mixed</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <div className="newtrip-label-row">
                  <Form.Label className="newtrip-label">Interests <span className="newtrip-required">*</span></Form.Label>
                  <span className={`newtrip-interest-count ${interests.length >= 3 ? 'valid' : ''}`}>
                    {interests.length}/3 min
                  </span>
                </div>
                <div className="interests-grid">
                  {interestOptions.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      className={`interest-chip ${interests.includes(interest) ? 'active' : ''}`}
                      onClick={() => toggleInterest(interest)}
                      aria-pressed={interests.includes(interest)}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                {interestError && <p className="newtrip-field-error">{interestError}</p>}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="newtrip-label">Additional Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Any special requests, must-see places, dietary needs..."
                  className="newtrip-input newtrip-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Form.Group>

              {genError && (
                <p className="newtrip-field-error" style={{ marginBottom: '12px' }}>{genError}</p>
              )}

              {generating && (
                <div className="newtrip-generating-bar">
                  <span className="loading-spinner" />
                  AI is planning your trip... this may take ~20 seconds
                </div>
              )}

              <div className="newtrip-modal-actions">
                <Button
                  variant="outline-light"
                  className="newtrip-back-btn"
                  onClick={() => setStep(1)}
                  disabled={generating}
                >
                  <ArrowLeft size={18} style={{ marginRight: '6px' }} />
                  Back
                </Button>
                <Button type="submit" variant="outline-light" className="newtrip-submit" disabled={generating}>
                  {generating ? 'Generating...' : 'Generate Itinerary'}
                  {!generating && <Star size={18} style={{ marginLeft: '8px' }} />}
                </Button>
              </div>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewTripModal;

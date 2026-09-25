import { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { RefreshCw, Save, AlertCircle } from 'lucide-react';
import PlaceAutocomplete from './PlaceAutocomplete';
import { API_BASE } from '../config';

const interestOptions = [
  'Museums', 'Food & Dining', 'Adventure', 'Nightlife',
  'Nature & Hiking', 'Shopping', 'History', 'Beach',
  'Photography', 'Local Culture',
];

const tripTypeOptions = [
  { value: 'adventure', label: 'Adventure' },
  { value: 'relaxation', label: 'Relaxation' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'road-trip', label: 'Road Trip' },
  { value: 'business', label: 'Business' },
];

const accommodationOptions = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'resort', label: 'Resort' },
  { value: 'camping', label: 'Camping' },
];

const transportOptions = [
  { value: 'flight', label: 'Flight' },
  { value: 'train', label: 'Train' },
  { value: 'car', label: 'Rental Car' },
  { value: 'bus', label: 'Bus' },
  { value: 'mixed', label: 'Mixed' },
];

function TripSettings({ tripData, onRegenerate }) {
  const tripId = tripData.tripId;

  const [title, setTitle] = useState(tripData.title || '');
  const [destination, setDestination] = useState(tripData.destination || '');
  const [startDate, setStartDate] = useState(tripData.startDate || '');
  const [endDate, setEndDate] = useState(tripData.endDate || '');
  const [numPeople, setNumPeople] = useState(tripData.numPeople || '');
  const [currentLocation, setCurrentLocation] = useState(tripData.currentLocation || '');
  const [tripType, setTripType] = useState(tripData.tripType || '');
  const [accommodation, setAccommodation] = useState(tripData.accommodation || '');
  const [transport, setTransport] = useState(tripData.transportation || tripData.transport || '');
  const [interests, setInterests] = useState(
    tripData.interests ? tripData.interests.split(', ').filter(Boolean) : []
  );
  const [notes, setNotes] = useState(tripData.notes || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [interestError, setInterestError] = useState('');

  const buildPrefsBody = () => ({
    currentLocation,
    tripType,
    accommodation,
    transportation: transport,
    interests: interests.join(', '),
    notes,
  });

  const toggleInterest = (interest) => {
    setInterests((prev) => {
      const next = prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest];
      if (next.length >= 3) setInterestError('');
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setGenError('');
    try {
      const res = await fetch(`${API_BASE}/api/trips/${tripId}/preferences`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPrefsBody()),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setGenError('Failed to save preferences: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (interests.length < 3) {
      setInterestError('Select at least 3 interests to regenerate');
      return;
    }
    setInterestError('');
    setGenError('');
    setGenerating(true);
    try {
      // Save latest preferences first
      const prefRes = await fetch(`${API_BASE}/api/trips/${tripId}/preferences`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPrefsBody()),
      });
      if (!prefRes.ok) throw new Error('Failed to save preferences: ' + await prefRes.text());

      // Trigger itinerary generation
      const genRes = await fetch(`${API_BASE}/api/trips/${tripId}/generate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!genRes.ok) throw new Error('Generation failed: ' + await genRes.text());

      if (onRegenerate) onRegenerate({ ...tripData, tripId });
    } catch (e) {
      setGenError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="trip-settings">
      <div className="trip-settings-header">
        <h3 className="trip-settings-title">Trip Settings</h3>
        <p className="trip-settings-desc">Update your trip details and preferences, then regenerate your itinerary</p>
      </div>

      <div className="trip-settings-body">
        {/* Trip Details */}
        <div className="trip-settings-section">
          <h4 className="trip-settings-section-title">Trip Details</h4>

          <Form.Group className="mb-3">
            <Form.Label className="newtrip-label">Trip Title</Form.Label>
            <Form.Control
              type="text"
              className="newtrip-input newtrip-input-readonly"
              value={title}
              readOnly
              disabled
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="newtrip-label">Destination</Form.Label>
            <Form.Control
              type="text"
              className="newtrip-input newtrip-input-readonly"
              value={destination}
              readOnly
              disabled
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="newtrip-label">Start Date <span className="newtrip-required">*</span></Form.Label>
                <Form.Control
                  type="date"
                  className="newtrip-input"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setSaved(false); }}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="newtrip-label">End Date <span className="newtrip-required">*</span></Form.Label>
                <Form.Control
                  type="date"
                  className="newtrip-input"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setSaved(false); }}
                  min={startDate || undefined}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="newtrip-label">Number of People <span className="newtrip-required">*</span></Form.Label>
            <Form.Control
              type="number"
              min="1"
              className="newtrip-input"
              value={numPeople}
              onChange={(e) => { setNumPeople(e.target.value); setSaved(false); }}
              required
            />
          </Form.Group>
        </div>

        {/* Preferences */}
        <div className="trip-settings-section">
          <h4 className="trip-settings-section-title">Preferences</h4>

          <Form.Group className="mb-3">
            <Form.Label className="newtrip-label">Your Current Location <span className="newtrip-required">*</span></Form.Label>
            <PlaceAutocomplete
              value={currentLocation}
              onChange={(v) => { setCurrentLocation(v); setSaved(false); }}
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
              onChange={(e) => { setTripType(e.target.value); setSaved(false); }}
              required
            >
              <option value="">Select type...</option>
              {tripTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="newtrip-label">Accommodation <span className="newtrip-required">*</span></Form.Label>
                <Form.Select
                  className="newtrip-input newtrip-select"
                  value={accommodation}
                  onChange={(e) => { setAccommodation(e.target.value); setSaved(false); }}
                  required
                >
                  <option value="">Select preference...</option>
                  {accommodationOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="newtrip-label">Transportation <span className="newtrip-required">*</span></Form.Label>
                <Form.Select
                  className="newtrip-input newtrip-select"
                  value={transport}
                  onChange={(e) => { setTransport(e.target.value); setSaved(false); }}
                  required
                >
                  <option value="">Select preference...</option>
                  {transportOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
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
                <span
                  key={interest}
                  className={`interest-chip ${interests.includes(interest) ? 'active' : ''}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </span>
              ))}
            </div>
            {interestError && <p className="newtrip-field-error">{interestError}</p>}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="newtrip-label">Additional Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              className="newtrip-input newtrip-textarea"
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
              placeholder="Any special requests, must-see places, dietary needs..."
            />
          </Form.Group>
        </div>
      </div>

      {/* Actions */}
      <div className="trip-settings-actions">
        <Button
          variant="outline-secondary"
          className="trip-settings-save-btn"
          onClick={handleSave}
          disabled={saving || generating}
        >
          <Save size={16} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
        </Button>
        <Button
          className="trip-settings-regen-btn"
          onClick={handleRegenerate}
          disabled={generating || saving}
        >
          <RefreshCw size={16} className={generating ? 'spin' : ''} />
          {generating ? 'Generating...' : 'Re-generate Itinerary'}
        </Button>
      </div>

      {genError && (
        <div className="trip-settings-warning" style={{ color: '#f43f5e', borderColor: '#f43f5e33' }}>
          <AlertCircle size={14} />
          {genError}
        </div>
      )}

      <div className="trip-settings-warning">
        <AlertCircle size={14} />
        Re-generating will replace your current itinerary with a new AI-generated one based on your preferences.
      </div>
    </div>
  );
}

export default TripSettings;

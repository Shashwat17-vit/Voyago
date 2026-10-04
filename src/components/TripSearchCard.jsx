import { useState } from 'react';
import { Stack } from 'react-bootstrap';
import { Calendar, ChevronRight } from 'lucide-react';
import PlaceAutocomplete from './PlaceAutocomplete';

function isValidStartDate(value) {
  if (!value) return false;
  const picked = new Date(`${value}T00:00:00`);
  if (Number.isNaN(picked.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return picked >= today;
}

function TripSearchCard({ onStartPlan }) {
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const canStart = destination.trim().length > 0 && isValidStartDate(date);

  const handleClick = () => {
    if (!canStart) return;
    onStartPlan({ destination: destination.trim(), startDate: date });
  };

  return (
    <div className="search-card">
      <div className="search-card-row">
        <PlaceAutocomplete
          value={destination}
          onChange={setDestination}
          placeholder="Search destinations..."
          className="search-input-hero"
        />
      </div>
      <p className="search-hint">Planning a multi-stop trip? You can add more destinations later.</p>
      <Stack direction="horizontal" gap={3} className="search-card-bottom flex-wrap">
        <div className="search-input-group search-input-date flex-grow-1">
          <Calendar size={18} className="search-input-icon" />
          <input
            type="date"
            placeholder="Select dates"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="search-input"
          />
        </div>
        <button
          type="button"
          className="search-cta-btn"
          onClick={handleClick}
          disabled={!canStart}
        >
          Start Planning
          <ChevronRight size={18} />
        </button>
      </Stack>
    </div>
  );
}

export default TripSearchCard;

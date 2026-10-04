import { useState } from 'react';
import { Calendar, Users, Trash2, Lock, Pencil } from 'lucide-react';
import './Collab.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80';

function formatDateRange(start, end) {
  if (!start) return '';
  const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

function calcNights(start, end) {
  if (!start || !end) return 0;
  return Math.round((new Date(end + 'T00:00:00') - new Date(start + 'T00:00:00')) / 86400000);
}

function daysToGo(startDate) {
  if (!startDate) return null;
  const diff = Math.ceil((new Date(startDate + 'T00:00:00') - new Date()) / 86400000);
  return diff >= 0 ? diff : null;
}

function AdventureTripCard({ trip, onClick, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const days   = daysToGo(trip.startDate);
  const nights = calcNights(trip.startDate, trip.endDate);
  const dates  = formatDateRange(trip.startDate, trip.endDate);
  const image  = trip.imageUrl || DEFAULT_IMAGE;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setConfirming(true);
  };

  const handleConfirm = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    await onDelete(trip.tid);
    setDeleting(false);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setConfirming(false);
  };

  return (
    <div className="adventure-card" onClick={onClick}>
      <div className="adventure-card-image">
        <img
          src={image}
          alt={`${trip.title} destination`}
          className="adventure-card-img"
        />
        {days !== null && (
          <div className="adventure-card-countdown">
            <Calendar size={14} />
            {days === 0 ? 'Today!' : `${days} days to go`}
          </div>
        )}
        {trip.isAdmin && (
          <div className="adventure-card-delete-wrap" onClick={(e) => e.stopPropagation()}>
            {!confirming ? (
              <button className="adventure-card-delete-btn" onClick={handleDeleteClick} title="Delete trip">
                <Trash2 size={14} />
              </button>
            ) : (
              <div className="adventure-card-confirm">
                <span>Delete?</span>
                <button className="adventure-card-confirm-yes" onClick={handleConfirm} disabled={deleting}>
                  {deleting ? '…' : 'Yes'}
                </button>
                <button className="adventure-card-confirm-no" onClick={handleCancel}>No</button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="adventure-card-body">
        <h3 className="adventure-card-title">{trip.title}</h3>
        <div className="adventure-card-meta">
          <span className="adventure-card-dates">
            <Calendar size={14} />
            {dates}
          </span>
          <span className="adventure-card-travelers">
            <Users size={14} />
            {trip.numTravelers} traveler{trip.numTravelers !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="adventure-card-footer">
          <span className="adventure-card-nights">{nights > 0 ? `${nights} nights` : '—'}</span>
          <span className={`status-pill ${trip.confirmed ? 'status-pill-confirmed' : 'status-pill-planning'}`}>
            {trip.confirmed ? <Lock size={10} /> : <Pencil size={10} />}
            {trip.confirmed ? 'Confirmed' : 'Planning'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AdventureTripCard;

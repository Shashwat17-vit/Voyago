import { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../config';
import { Row, Col, Stack } from 'react-bootstrap';
import {
  ChevronLeft, ChevronRight, CalendarDays, LayoutGrid,
  MapPin, Clock, X, Navigation, StickyNote, Tag,
  Home, Plane, Utensils, Camera, Car, Users, Scissors,
  Flag, CheckSquare, Trash2, Save,
  Bold, Italic, Underline, List, ListOrdered, ListChecks,
  ArrowRight, Globe, MessageCircle, Send, Sparkles, Plus,
  Pencil,
} from 'lucide-react';
import './ItineraryCalendar.css';

const HOUR_HEIGHT = 88;
const LEAD_HOURS = 2;
const MIN_EVENT_HEIGHT = 48;
// Title, time and location stacked need roughly this much room; shorter events
// drop to a single row so the title is never clipped.
const STACKED_EVENT_HEIGHT = 74;

const CATEGORY_COLORS = {
  SIGHTSEEING: '#3b82f6',
  FOOD: '#f97316',
  ACTIVITY: '#f43f5e',
  TRANSPORT: '#64748b',
  ACCOMMODATION: '#8b5cf6',
};

function buildItinerary(apiDays) {
  const result = {};
  for (const day of apiDays) {
    result[day.date] = day.events.map((e) => {
      const time = e.startTime ? e.startTime.substring(0, 5) : '08:00';
      let duration = 1;
      if (e.startTime && e.endTime) {
        const [sh, sm] = e.startTime.split(':').map(Number);
        const [eh, em] = e.endTime.split(':').map(Number);
        const diff = (eh * 60 + em - sh * 60 - sm) / 60;
        if (diff > 0) duration = diff;
      }
      const cat = (e.category || '').toUpperCase();
      return {
        eventId: e.eventId,
        time,
        duration,
        title: e.title || '',
        location: e.locationName || '',
        color: CATEGORY_COLORS[cat] || '#3b82f6',
        category: e.category || 'Event',
        notes: e.description || '',
      };
    });
  }
  return result;
}

function getDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function getShortDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    day: d.getDate(),
  };
}

function formatHour(h) {
  if (h === 0 || h === 24) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function visibleHourRange(activities) {
  let firstHour = 24;
  let lastHour = 0;
  for (const act of activities) {
    if (!act?.time) continue;
    const [h, m] = String(act.time).split(':').map(Number);
    if (Number.isNaN(h)) continue;
    firstHour = Math.min(firstHour, h);
    const end = h + (m || 0) / 60 + (act.duration || 1);
    lastHour = Math.max(lastHour, Math.ceil(end));
  }
  if (firstHour === 24) {
    return { start: 8, end: 20 };
  }
  const start = Math.max(0, firstHour - LEAD_HOURS);
  const end = Math.min(24, Math.max(lastHour + 1, start + 6));
  return { start, end };
}

function timeToOffset(timeStr, hourStart) {
  const [h, m] = timeStr.split(':').map(Number);
  return (h - hourStart + m / 60) * HOUR_HEIGHT;
}

function durationToHeight(duration) {
  return duration * HOUR_HEIGHT;
}

function formatTimeRange(timeStr, duration) {
  const [h, m] = timeStr.split(':').map(Number);
  const startMin = h * 60 + m;
  const endMin = startMin + duration * 60;
  const fmt = (mins) => {
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const suffix = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    return mm === 0 ? `${h12} ${suffix}` : `${h12}:${String(mm).padStart(2, '0')} ${suffix}`;
  };
  return `${fmt(startMin)} - ${fmt(endMin)}`;
}

function formatDuration(duration) {
  const h = Math.floor(duration);
  const m = Math.round((duration - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

const EVENT_TYPES = [
  { id: 'event', label: 'Event', icon: CalendarDays, color: '#3b82f6' },
  { id: 'accommodation', label: 'Stay', icon: Home, color: '#8b5cf6' },
  { id: 'flight', label: 'Flight', icon: Plane, color: '#0ea5e9' },
  { id: 'food', label: 'Food', icon: Utensils, color: '#f97316' },
  { id: 'sightseeing', label: 'Sight', icon: Camera, color: '#22c55e' },
  { id: 'transport', label: 'Transport', icon: Car, color: '#64748b' },
  { id: 'group', label: 'Group', icon: Users, color: '#ec4899' },
  { id: 'activity', label: 'Activity', icon: Scissors, color: '#f43f5e' },
  { id: 'milestone', label: 'Flag', icon: Flag, color: '#eab308' },
  { id: 'task', label: 'Task', icon: CheckSquare, color: '#14b8a6' },
];


function computeDateTime(dateStr, timeStr, durationH) {
  if (!dateStr || !timeStr) return { startDT: '', endDT: '' };
  const [h, m] = timeStr.split(':').map(Number);
  const endMin = h * 60 + m + durationH * 60;
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;
  const pad = (n) => String(n).padStart(2, '0');
  const fmtDT = (hh, mm) => {
    const suffix = hh >= 12 ? 'pm' : 'am';
    const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    return `${dateStr.replace(/-/g, '/')} ${h12}:${pad(mm)} ${suffix}`;
  };
  return { startDT: fmtDT(h, m), endDT: fmtDT(endH, endM) };
}

const CHAT_SUGGESTIONS = [
  { icon: Utensils, text: 'Best restaurants nearby', category: 'food' },
  { icon: Plane, text: 'Find flights to this destination', category: 'flight' },
  { icon: Camera, text: 'Top attractions to visit', category: 'sightseeing' },
  { icon: Home, text: 'Recommend places to stay', category: 'stay' },
];

const MOCK_RESPONSES = {
  food: [
    { name: 'Karim\'s', desc: 'Legendary Mughlai cuisine since 1913. Famous for seekh kebabs and mutton burra.', time: '7:00 PM - 9:00 PM', location: 'Jama Masjid Area' },
    { name: 'Indian Accent', desc: 'Award-winning modern Indian fine dining. Innovative tasting menus.', time: '8:00 PM - 10:00 PM', location: 'The Lodhi Hotel' },
    { name: 'Paranthe Wali Gali', desc: 'Historic street famous for stuffed paranthas since the 1870s.', time: '9:00 AM - 12:00 PM', location: 'Chandni Chowk' },
  ],
  flight: [
    { name: 'Air India AI-302', desc: 'Direct flight. Economy from $450, Business from $1,200.', time: 'Departs 6:30 AM', location: 'JFK → DEL' },
    { name: 'Emirates EK-510', desc: 'Via Dubai. Premium economy from $680. Excellent service.', time: 'Departs 10:15 PM', location: 'JFK → DXB → DEL' },
  ],
  sightseeing: [
    { name: 'Red Fort', desc: 'UNESCO World Heritage Site. Iconic Mughal architecture and light show in evenings.', time: '9:30 AM - 12:00 PM', location: 'Old Delhi' },
    { name: 'Humayun\'s Tomb', desc: 'Precursor to the Taj Mahal. Stunning Mughal gardens at sunset.', time: '3:00 PM - 5:30 PM', location: 'Nizamuddin' },
    { name: 'Qutub Minar', desc: 'Tallest brick minaret in the world. Also see the Iron Pillar.', time: '10:00 AM - 12:30 PM', location: 'Mehrauli' },
  ],
  stay: [
    { name: 'The Lodhi', desc: '5-star luxury with private plunge pools. Excellent spa and fine dining.', time: 'Check-in 2 PM', location: 'Lodhi Road' },
    { name: 'Zostel Delhi', desc: 'Modern hostel in South Delhi. Great for solo travelers. From $15/night.', time: 'Check-in 1 PM', location: 'Hauz Khas' },
  ],
};

function ChatBotTab({ destination }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Hi! I'm your Voyago travel assistant. I can help you find restaurants, flights, attractions, and stays for your trip to **${destination || 'your destination'}**. What are you looking for?` },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const detectCategory = (text) => {
    const lower = text.toLowerCase();
    if (/eat|food|restaurant|dinner|lunch|breakfast|cuisine/i.test(lower)) return 'food';
    if (/flight|fly|airline|airport/i.test(lower)) return 'flight';
    if (/see|visit|attraction|sightse|monument|temple|museum|tour/i.test(lower)) return 'sightseeing';
    if (/stay|hotel|hostel|accomm|lodge|airbnb/i.test(lower)) return 'stay';
    return null;
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: text.trim() }]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const cat = detectCategory(text);
      const results = cat ? MOCK_RESPONSES[cat] : null;

      if (results) {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          text: `Here are my top recommendations:`,
          suggestions: results,
          category: cat,
        }]);
      } else {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          text: `I can help you find **restaurants**, **flights**, **attractions**, or **places to stay**. Try asking something like "Best places to eat near Old Delhi" or "Find flights from New York".`,
        }]);
      }
      setTyping(false);
    }, 1200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const renderMarkdown = (text) =>
    text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  return (
    <div className="chatbot-container">
      <div className="chatbot-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chatbot-msg ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="chatbot-avatar-wrap">
                <span className="chatbot-avatar"><Sparkles size={14} /></span>
              </div>
            )}
            <div className="chatbot-bubble-wrap">
              <div className={`chatbot-bubble chatbot-bubble-${msg.role}`}>
                <p dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                {msg.suggestions && (
                  <div className="chatbot-suggestions-list">
                    {msg.suggestions.map((s, j) => (
                      <div key={j} className="chatbot-suggestion-card">
                        <div className="chatbot-suggestion-header">
                          <strong>{s.name}</strong>
                          <button className="chatbot-add-btn" title="Add to itinerary">
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="chatbot-suggestion-desc">{s.desc}</p>
                        <div className="chatbot-suggestion-meta">
                          <span><Clock size={12} /> {s.time}</span>
                          <span><MapPin size={12} /> {s.location}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {typing && (
          <div className="chatbot-msg assistant">
            <div className="chatbot-avatar-wrap">
              <span className="chatbot-avatar"><Sparkles size={14} /></span>
            </div>
            <div className="chatbot-bubble-wrap">
              <div className="chatbot-bubble chatbot-bubble-assistant">
                <div className="chatbot-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="chatbot-quick-actions">
        {CHAT_SUGGESTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button key={i} className="chatbot-quick-btn" onClick={() => sendMessage(s.text)}>
              <Icon size={14} /> {s.text}
            </button>
          );
        })}
      </div>

      <form className="chatbot-input-bar" onSubmit={handleSubmit}>
        <input
          className="chatbot-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about restaurants, flights, attractions..."
        />
        <button className="chatbot-send-btn" type="submit" disabled={!input.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

function EventDetailPanel({ event, createMode, dayId, onClose, currentDate, destination, canEdit = true, onEventChange }) {
  const [closing, setClosing] = useState(false);
  const [modalTab, setModalTab] = useState('edit');
  const [eventType, setEventType] = useState('event');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const descRef = useRef(null);
  const prevEventRef = useRef(null);

  if (event && event !== prevEventRef.current) {
    prevEventRef.current = event;
    const typeId = EVENT_TYPES.find((t) => t.id === (event.category || 'event').toLowerCase())?.id || 'event';
    if (eventType !== typeId) setEventType(typeId);
    if (title !== event.title) setTitle(event.title);
    if (location !== (event.location || '')) setLocation(event.location || '');
    if (description !== (event.notes || '')) setDescription(event.notes || '');

    const st = event.time || '08:00';
    const [sh, sm] = st.split(':').map(Number);
    const endMin = sh * 60 + sm + (event.duration || 1) * 60;
    const eh = Math.floor(endMin / 60) % 24;
    const em = endMin % 60;
    setStartTime(st.substring(0, 5));
    setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
  }

  const handleClose = () => {
    setClosing(true);
    setConfirmDelete(false);
    setTimeout(() => { setClosing(false); onClose(); }, 300);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        title,
        description: descRef.current?.innerText || description,
        locationName: location,
        category: eventType.toUpperCase(),
        startTime,
        endTime,
      };
      const url = createMode
        ? `${API_BASE}/api/events/day/${dayId}`
        : `${API_BASE}/api/events/${event.eventId}`;
      const method = createMode ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      onEventChange?.();
      handleClose();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/api/events/${event.eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      onEventChange?.();
      handleClose();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!event && !createMode && !closing) return null;

  const activeType = EVENT_TYPES.find((t) => t.id === eventType) || EVENT_TYPES[0];

  const execFormat = (cmd) => {
    document.execCommand(cmd, false, null);
    descRef.current?.focus();
  };

  return (
    <div className={`cal-detail-backdrop ${closing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`cal-drawer ${closing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Top Tab Bar */}
        <div className="cal-modal-tabs">
          <button
            className={`cal-modal-tab ${modalTab === 'edit' ? 'active' : ''}`}
            onClick={() => setModalTab('edit')}
          >
            <Pencil size={16} />
            Edit Event
          </button>
          <button
            className={`cal-modal-tab ${modalTab === 'chat' ? 'active' : ''}`}
            onClick={() => setModalTab('chat')}
          >
            <MessageCircle size={16} />
            ChatBot
            <span className="cal-modal-tab-badge"><Sparkles size={10} /></span>
          </button>
          <div className="cal-modal-tabs-spacer" />
          <button className="cal-modal-close" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {modalTab === 'edit' ? (
          <>
            {/* Edit Event Header */}
            <div className="cal-modal-header">
              <div className="cal-modal-header-left">
                <span className="cal-modal-header-icon" style={{ background: activeType.color }}>
                  <activeType.icon size={18} color="#fff" />
                </span>
                <div>
                  <h3 className="cal-modal-title-text">
                    {createMode ? 'New Event' : canEdit ? 'Edit Event' : 'Event'}
                  </h3>
                  <span className="cal-modal-subtitle">{activeType.label}</span>
                </div>
              </div>
            </div>

            {/* Event Type Tabs */}
            <div className="cal-modal-types">
              <span className="cal-modal-type-label">Event</span>
              <div className="cal-modal-type-icons">
                {EVENT_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      className={`cal-modal-type-btn ${eventType === t.id ? 'active' : ''}`}
                      style={eventType === t.id ? { background: t.color, color: '#fff' } : {}}
                      onClick={() => setEventType(t.id)}
                      title={t.label}
                      disabled={!canEdit}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="cal-modal-body">
              <div className="cal-modal-section">
                <div className="cal-modal-title-row">
                  <span className="cal-modal-emoji" style={{ background: activeType.color + '18', color: activeType.color }}>
                    <activeType.icon size={20} />
                  </span>
                  <input
                    className="cal-modal-title-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Event name"
                    readOnly={!canEdit}
                  />
                </div>
              </div>

              <div className="cal-modal-section">
                <h4 className="cal-modal-section-title">
                  <CalendarDays size={16} className="cal-modal-section-icon" style={{ color: '#f97316' }} />
                  When — {currentDate}
                </h4>
                <div className="cal-modal-when-row">
                  <div className="cal-modal-when-field">
                    <label className="cal-modal-when-label">Start</label>
                    <input
                      type="time"
                      className="cal-modal-input"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      readOnly={!canEdit}
                    />
                  </div>
                  <ArrowRight size={16} className="cal-modal-when-arrow" />
                  <div className="cal-modal-when-field">
                    <label className="cal-modal-when-label">End</label>
                    <input
                      type="time"
                      className="cal-modal-input"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      readOnly={!canEdit}
                    />
                  </div>
                  <span className="cal-modal-tz">{timezone}</span>
                </div>
              </div>

              <div className="cal-modal-section">
                <h4 className="cal-modal-section-title">
                  <MapPin size={16} className="cal-modal-section-icon" style={{ color: '#22c55e' }} />
                  Location
                </h4>
                <div className="cal-modal-location-wrap">
                  <MapPin size={16} className="cal-modal-location-icon" />
                  <input
                    className="cal-modal-input cal-modal-location-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Search for a place"
                    readOnly={!canEdit}
                  />
                  {location && (
                    <a
                      className="cal-modal-map-link"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on Map"
                    >
                      <Globe size={16} />
                    </a>
                  )}
                </div>
              </div>

              <div className="cal-modal-section">
                <h4 className="cal-modal-section-title">
                  <StickyNote size={16} className="cal-modal-section-icon" style={{ color: '#f59e0b' }} />
                  Description
                </h4>
                <div className="cal-modal-editor">
                  {canEdit && (
                    <div className="cal-modal-editor-toolbar">
                      <button className="cal-modal-editor-btn" onClick={() => execFormat('bold')} title="Bold"><Bold size={16} /></button>
                      <button className="cal-modal-editor-btn" onClick={() => execFormat('italic')} title="Italic"><Italic size={16} /></button>
                      <button className="cal-modal-editor-btn" onClick={() => execFormat('underline')} title="Underline"><Underline size={16} /></button>
                      <span className="cal-modal-editor-sep" />
                      <button className="cal-modal-editor-btn" onClick={() => execFormat('insertUnorderedList')} title="Bullet List"><List size={16} /></button>
                      <button className="cal-modal-editor-btn" onClick={() => execFormat('insertOrderedList')} title="Numbered List"><ListOrdered size={16} /></button>
                      <button className="cal-modal-editor-btn" title="Checklist"><ListChecks size={16} /></button>
                    </div>
                  )}
                  <div
                    ref={descRef}
                    className="cal-modal-editor-area"
                    contentEditable={canEdit}
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: description }}
                    onBlur={(e) => setDescription(e.currentTarget.innerHTML)}
                    data-placeholder="Add notes, details, or instructions..."
                  />
                </div>
              </div>
            </div>

            {saveError && (
              <p style={{ color: '#f43f5e', fontSize: '0.8rem', padding: '0 1.25rem', margin: '0 0 8px' }}>{saveError}</p>
            )}

            <Stack direction="horizontal" gap={2} className="cal-modal-footer flex-wrap justify-content-between">
              <Stack direction="horizontal" gap={2}>
                {canEdit && !createMode && (
                  !confirmDelete ? (
                    <button
                      className="cal-modal-footer-btn cal-modal-delete-btn"
                      onClick={() => setConfirmDelete(true)}
                      disabled={deleting}
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  ) : (
                    <>
                      <button
                        className="cal-modal-footer-btn cal-modal-delete-btn"
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? '…' : 'Confirm Delete'}
                      </button>
                      <button
                        className="cal-modal-footer-btn cal-modal-cancel-btn"
                        onClick={() => setConfirmDelete(false)}
                      >
                        Keep
                      </button>
                    </>
                  )
                )}
              </Stack>
              <Stack direction="horizontal" gap={2}>
                <button className="cal-modal-footer-btn cal-modal-cancel-btn" onClick={handleClose}>
                  {canEdit ? 'Cancel' : 'Close'}
                </button>
                {canEdit && (
                  <button
                    className="cal-modal-footer-btn cal-modal-save-btn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save size={15} /> {saving ? 'Saving…' : createMode ? 'Create Event' : 'Save Event'}
                  </button>
                )}
              </Stack>
            </Stack>
          </>
        ) : (
          <ChatBotTab destination={destination} />
        )}
      </div>
    </div>
  );
}

/* ── Day View ── */
function DayView({ activities, onEventClick }) {
  const { start: hourStart, end: hourEnd } = visibleHourRange(activities);
  const hours = [];
  for (let h = hourStart; h <= hourEnd; h++) hours.push(h);
  const totalHeight = Math.max(hourEnd - hourStart, 1) * HOUR_HEIGHT;

  return (
    <div className="cal-day-view">
      <div className="cal-day-grid" style={{ height: totalHeight }}>
        <div className="cal-day-hours">
          {hours.map((h) => (
            <div key={h} className="cal-hour-label" style={{ height: HOUR_HEIGHT }}>
              <span>{formatHour(h)}</span>
            </div>
          ))}
        </div>
        <div className="cal-day-content" style={{ height: totalHeight }}>
          {hours.map((h) => (
            <div key={h} className="cal-hour-line" style={{ top: (h - hourStart) * HOUR_HEIGHT }} />
          ))}
          {activities.map((act, i) => {
            const height = Math.max(durationToHeight(act.duration), MIN_EVENT_HEIGHT);
            const compact = height < STACKED_EVENT_HEIGHT;
            return (
              <div
                key={i}
                className={`cal-event-block ${compact ? 'cal-event-block-compact' : ''}`}
                onClick={() => onEventClick(act)}
                style={{
                  top: timeToOffset(act.time, hourStart),
                  height,
                  borderLeftColor: act.color,
                }}
                title={act.title}
              >
                <div className="cal-event-title">{act.title}</div>
                <div className="cal-event-meta">
                  <Clock size={12} />
                  {formatTimeRange(act.time, act.duration)}
                </div>
                {!compact && act.location && (
                  <div className="cal-event-meta">
                    <MapPin size={12} />
                    {act.location}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Week View ── */
function WeekView({ dates, itinerary, onEventClick }) {
  const allActivities = dates.flatMap((date) => itinerary[date] || []);
  const { start: hourStart, end: hourEnd } = visibleHourRange(allActivities);
  const hours = [];
  for (let h = hourStart; h <= hourEnd; h++) hours.push(h);
  const totalHeight = Math.max(hourEnd - hourStart, 1) * HOUR_HEIGHT;

  return (
    <div className="cal-week-view">
      {/* Sticky day-name header */}
      <div className="cal-week-header-bar">
        <div className="cal-week-gutter" />
        {dates.map((date) => {
          const { weekday, day } = getShortDayLabel(date);
          return (
            <div key={date} className="cal-week-col-head">
              <span className="cal-week-weekday">{weekday}</span>
              <span className="cal-week-day">{day}</span>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div className="cal-week-scroll">
        <div className="cal-week-time-grid" style={{ height: totalHeight }}>
          {/* Hour labels (sticky left) */}
          <div className="cal-week-hours">
            {hours.map((h) => (
              <div key={h} className="cal-week-hour-label" style={{ height: HOUR_HEIGHT }}>
                <span>{formatHour(h)}</span>
              </div>
            ))}
          </div>

          {/* One column per day */}
          {dates.map((date) => {
            const activities = itinerary[date] || [];
            return (
              <div key={date} className="cal-week-col" style={{ height: totalHeight }}>
                {/* Background hour lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="cal-week-hr-line"
                    style={{ top: (h - hourStart) * HOUR_HEIGHT }}
                  />
                ))}
                {/* Absolutely-positioned event blocks */}
                {activities.map((act, i) => (
                  <div
                    key={i}
                    className="cal-week-event"
                    onClick={() => onEventClick(act)}
                    style={{
                      top: timeToOffset(act.time, hourStart),
                      height: Math.max(durationToHeight(act.duration), MIN_EVENT_HEIGHT),
                      borderLeftColor: act.color,
                      backgroundColor: act.color + '1a',
                    }}
                    title={act.title}
                  >
                    <span className="cal-week-event-title" style={{ color: act.color }}>
                      {act.title}
                    </span>
                    <span className="cal-week-event-time">{act.time}</span>
                    {act.notes && (
                      <span className="cal-week-event-desc">{act.notes}</span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Main Calendar ── */
function ItineraryCalendar({ tripId, tripTitle, destination, canEdit = true }) {
  const [itinerary, setItinerary] = useState({});
  const [dayIdMap, setDayIdMap] = useState({});
  const [itineraryLoading, setItineraryLoading] = useState(true);
  const [view, setView] = useState('day');
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);

  const loadItinerary = () => {
    if (!tripId) { setItineraryLoading(false); return; }
    fetch(`${API_BASE}/api/trips/${tripId}/itinerary`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setItinerary(buildItinerary(data));
          const idMap = {};
          for (const day of data) idMap[day.date] = day.dayId;
          setDayIdMap(idMap);
        }
        setItineraryLoading(false);
      })
      .catch(() => setItineraryLoading(false));
  };

  useEffect(() => {
    setItineraryLoading(true);
    loadItinerary();
  }, [tripId]);

  const allDates = Object.keys(itinerary).sort();
  const currentDate = allDates[currentDateIndex] || '';
  const currentActivities = itinerary[currentDate] || [];

  const prevDay = () => setCurrentDateIndex((i) => Math.max(0, i - 1));
  const nextDay = () => setCurrentDateIndex((i) => Math.min(allDates.length - 1, i + 1));

  if (itineraryLoading) {
    return (
      <div className="cal-container">
        <p style={{ color: '#aaa', padding: 40, textAlign: 'center' }}>Loading itinerary...</p>
      </div>
    );
  }

  if (allDates.length === 0) {
    return (
      <div className="cal-container">
        <div className="cal-header">
          <div className="cal-header-info">
            <h2 className="cal-trip-title">{tripTitle}</h2>
            <span className="cal-trip-dest"><MapPin size={14} />{destination}</span>
          </div>
        </div>
        <p style={{ color: '#aaa', padding: 40, textAlign: 'center' }}>
          No itinerary yet. Generate one from the Settings tab.
        </p>
      </div>
    );
  }

  return (
    <div className="cal-container">
      <div className="cal-header">
        <div className="cal-header-info">
          <h2 className="cal-trip-title">{tripTitle}</h2>
          <span className="cal-trip-dest">
            <MapPin size={14} />
            {destination}
          </span>
        </div>
        <div className="cal-header-controls">
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevDay} disabled={currentDateIndex === 0}>
              <ChevronLeft size={18} />
            </button>
            <span className="cal-nav-label">{getDateLabel(currentDate)}</span>
            <button className="cal-nav-btn" onClick={nextDay} disabled={currentDateIndex === allDates.length - 1}>
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="cal-view-toggle">
            <button
              className={`cal-view-btn ${view === 'day' ? 'active' : ''}`}
              onClick={() => setView('day')}
            >
              <CalendarDays size={16} />
              Day
            </button>
            <button
              className={`cal-view-btn ${view === 'week' ? 'active' : ''}`}
              onClick={() => setView('week')}
            >
              <LayoutGrid size={16} />
              Week
            </button>
          </div>
          {canEdit && (
            <button
              className="cal-add-btn"
              onClick={() => { setSelectedEvent(null); setShowAddEvent(true); }}
            >
              <Plus size={15} />
              Add Event
            </button>
          )}
        </div>
      </div>

      {view === 'day' && (
        <DayView activities={currentActivities} onEventClick={setSelectedEvent} />
      )}

      {view === 'week' && (
        <WeekView dates={allDates} itinerary={itinerary} onEventClick={setSelectedEvent} />
      )}

      <EventDetailPanel
        key={showAddEvent ? 'create' : (selectedEvent?.eventId ?? 'none')}
        event={selectedEvent}
        createMode={showAddEvent}
        dayId={dayIdMap[currentDate]}
        onClose={() => { setSelectedEvent(null); setShowAddEvent(false); }}
        currentDate={currentDate}
        destination={destination}
        canEdit={canEdit}
        onEventChange={loadItinerary}
      />
    </div>
  );
}

export default ItineraryCalendar;

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { API_BASE } from '../config';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CATEGORY_COLORS = {
  SIGHTSEEING: '#3b82f6',
  FOOD: '#f97316',
  ACTIVITY: '#f43f5e',
  TRANSPORT: '#64748b',
  ACCOMMODATION: '#8b5cf6',
};

function pinIcon(color) {
  return L.divIcon({
    className: 'trip-map-pin',
    html: `<span class="trip-map-pin-dot" style="background:${color}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function FitPins({ pins }) {
  const map = useMap();
  useEffect(() => {
    if (!pins.length) return;
    if (pins.length === 1) {
      map.flyTo(pins[0].coords, 13, { duration: 1.1 });
      return;
    }
    const bounds = L.latLngBounds(pins.map((p) => p.coords));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [pins, map]);
  return null;
}

async function geocode(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'Voyago/1.0' } },
  );
  const data = await res.json();
  if (!data?.length) return null;
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

function TripMap({ destination, tripId }) {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const collected = [];

        if (tripId) {
          const res = await fetch(`${API_BASE}/api/trips/${tripId}/itinerary`, { credentials: 'include' });
          const days = res.ok ? await res.json() : [];
          if (Array.isArray(days)) {
            for (const day of days) {
              for (const ev of day.events || []) {
                const name = ev.locationName || ev.title;
                if (!name) continue;
                let coords = null;
                if (ev.latitude != null && ev.longitude != null) {
                  coords = [Number(ev.latitude), Number(ev.longitude)];
                }
                collected.push({
                  id: ev.eventId || `${day.dayId}-${ev.title}`,
                  title: ev.title || name,
                  location: ev.locationName || '',
                  time: ev.startTime ? String(ev.startTime).substring(0, 5) : '',
                  dayLabel: day.dayLabel || `Day ${day.dayNumber}`,
                  color: CATEGORY_COLORS[(ev.category || '').toUpperCase()] || '#3b82f6',
                  coords,
                  query: ev.locationName
                    ? `${ev.locationName}${destination ? `, ${destination}` : ''}`
                    : destination,
                });
              }
            }
          }
        }

        for (const pin of collected) {
          if (pin.coords || !pin.query) continue;
          pin.coords = await geocode(pin.query);
          await new Promise((r) => setTimeout(r, 1100));
          if (cancelled) return;
        }

        if (!collected.some((p) => p.coords) && destination) {
          const city = await geocode(destination);
          if (city) {
            collected.push({
              id: 'destination',
              title: destination,
              location: destination,
              time: '',
              dayLabel: 'Destination',
              color: '#3b82f6',
              coords: city,
            });
          }
        }

        const ready = collected.filter((p) => p.coords);
        if (!cancelled) {
          if (!ready.length) setError(`Could not place "${destination}" on the map`);
          setPins(ready);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load map data');
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [destination, tripId]);

  if (loading) {
    return (
      <div className="trip-map-wrapper">
        <div className="trip-map-loading">
          <div className="loading-spinner" />
          <p>Loading map for {destination}...</p>
        </div>
      </div>
    );
  }

  if (error && !pins.length) {
    return (
      <div className="trip-map-wrapper">
        <div className="trip-map-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const center = pins[0]?.coords || [20, 0];

  return (
    <div className="trip-map-wrapper">
      <div className="trip-map-header">
        <h3 className="trip-map-title">{destination}</h3>
        <p className="trip-map-place">
          {pins.length} stop{pins.length === 1 ? '' : 's'} on this itinerary
        </p>
      </div>
      <div className="trip-map-container">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom
          style={{ height: '100%', width: '100%', borderRadius: '12px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {pins.map((pin) => (
            <Marker key={pin.id} position={pin.coords} icon={pinIcon(pin.color)}>
              <Popup>
                <strong>{pin.title}</strong>
                <br />
                {pin.dayLabel}{pin.time ? ` · ${pin.time}` : ''}
                {pin.location && pin.location !== pin.title && (
                  <>
                    <br />
                    {pin.location}
                  </>
                )}
              </Popup>
            </Marker>
          ))}
          <FitPins pins={pins} />
        </MapContainer>
      </div>
    </div>
  );
}

export default TripMap;

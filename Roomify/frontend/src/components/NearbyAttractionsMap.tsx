import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { API_BASE_URL } from '../config/api';
import { MapPin, Navigation, Utensils, Church, ShoppingBag, Trees, Landmark, Heart, AlertCircle } from 'lucide-react';

// Fix Leaflet default marker icon issue in Vite builds
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Attraction {
  attraction_id: number;
  name: string;
  category: string;
  description: string;
  distance_km: number;
  lat: number;
  lng: number;
}

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; emoji: string }> = {
  Restaurant: { color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: <Utensils className="w-4 h-4" />, emoji: '🍽️' },
  Temple:     { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: <Church   className="w-4 h-4" />, emoji: '🕌' },
  Mall:       { color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: <ShoppingBag className="w-4 h-4" />, emoji: '🛍️' },
  Park:       { color: 'text-green-600',  bg: 'bg-green-50  border-green-200',  icon: <Trees    className="w-4 h-4" />, emoji: '🌳' },
  Museum:     { color: 'text-blue-600',   bg: 'bg-blue-50   border-blue-200',   icon: <Landmark className="w-4 h-4" />, emoji: '🏛️' },
  Hospital:   { color: 'text-red-600',    bg: 'bg-red-50    border-red-200',    icon: <Heart    className="w-4 h-4" />, emoji: '🏥' },
  Other:      { color: 'text-gray-600',   bg: 'bg-gray-50   border-gray-200',   icon: <MapPin   className="w-4 h-4" />, emoji: '📍' },
};

const HOTEL_LAT = 12.9716;
const HOTEL_LNG = 77.5946;

export const NearbyAttractionsMap: React.FC = () => {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [selected,    setSelected]    = useState<Attraction | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/service-requests/attractions`)
      .then(r => r.json())
      .then(data => { setAttractions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !mapRef.current || mapInstance.current) return;

    // Build the map
    const map = L.map(mapRef.current, {
      center: [HOTEL_LAT, HOTEL_LNG],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 19,
    }).addTo(map);

    // Hotel marker (special)
    const hotelIcon = L.divIcon({
      html: `<div style="background:linear-gradient(135deg,#006B5C,#00C9A7);color:white;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 15px rgba(0,107,92,0.4);border:3px solid white;">🏨</div>`,
      className: '',
      iconSize:   [44, 44],
      iconAnchor: [22, 22],
    });
    L.marker([HOTEL_LAT, HOTEL_LNG], { icon: hotelIcon })
      .addTo(map)
      .bindPopup('<strong>The Living Canvas Hotel</strong><br>You are here 📍', { maxWidth: 200 });

    // Attraction markers
    attractions.forEach(a => {
      const cfg   = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG['Other'];
      const color = cfg.color.replace('text-', '').replace('-600', '');
      const colorMap: Record<string, string> = {
        orange: '#ea580c', yellow: '#ca8a04', purple: '#9333ea',
        green: '#16a34a', blue: '#2563eb', red: '#dc2626', gray: '#6b7280',
      };
      const bg = colorMap[color] || '#6b7280';

      const icon = L.divIcon({
        html: `<div style="background:${bg};color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 12px rgba(0,0,0,0.25);border:2px solid white;">${cfg.emoji}</div>`,
        className: '',
        iconSize:   [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([a.lat, a.lng], { icon })
        .addTo(map)
        .bindPopup(`<strong>${a.name}</strong><br><span style="color:#666;font-size:12px">${a.distance_km} km from hotel</span>`, { maxWidth: 200 });
    });

    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [loading, attractions]);

  const categories = ['All', ...Array.from(new Set(attractions.map(a => a.category)))];
  const filtered   = activeCategory === 'All' ? attractions : attractions.filter(a => a.category === activeCategory);

  return (
    <div className="w-full">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
              activeCategory === cat
                ? 'bg-[#006B5C] text-white border-[#006B5C] shadow-lg shadow-[#006B5C]/30'
                : 'bg-white/20 text-[#e7c987] border-[#e7c987]/30 hover:border-[#e7c987]'
            }`}
          >
            {CATEGORY_CONFIG[cat]?.emoji || '🗺️'} {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Panel */}
        <div className="lg:col-span-2">
          <div
            ref={mapRef}
            className="w-full rounded-2xl overflow-hidden border border-white/10"
            style={{ height: '420px' }}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
              <p className="text-white font-bold">Loading map...</p>
            </div>
          )}
        </div>

        {/* Attraction List */}
        <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
          {filtered.map(a => {
            const cfg = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG['Other'];
            return (
              <button
                key={a.attraction_id}
                onClick={() => {
                  setSelected(a);
                  mapInstance.current?.flyTo([a.lat, a.lng], 16, { duration: 1 });
                }}
                className={`text-left p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 ${
                  selected?.attraction_id === a.attraction_id
                    ? 'bg-[#006B5C]/30 border-[#00C9A7] shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm leading-tight">{a.name}</p>
                    <p className="text-[#e7c987]/70 text-xs mt-1 line-clamp-2">{a.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-[#00C9A7] text-xs font-bold">
                      <Navigation className="w-3 h-3" />
                      {a.distance_km} km from hotel
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div className="text-center text-white/40 font-bold py-8">No attractions in this category.</div>
          )}
        </div>
      </div>

      {/* Selected Info Panel */}
      {selected && (
        <div className="mt-4 p-4 rounded-2xl bg-[#006B5C]/20 border border-[#00C9A7]/30 flex items-center gap-4">
          <span className="text-3xl">{CATEGORY_CONFIG[selected.category]?.emoji || '📍'}</span>
          <div>
            <p className="font-black text-white">{selected.name}</p>
            <p className="text-[#e7c987]/80 text-sm">{selected.description}</p>
            <p className="text-[#00C9A7] text-xs font-bold mt-1">{selected.distance_km} km · {selected.category}</p>
          </div>
          <button onClick={() => setSelected(null)} className="ml-auto text-white/40 hover:text-white/80 transition-colors text-xl">✕</button>
        </div>
      )}
    </div>
  );
};

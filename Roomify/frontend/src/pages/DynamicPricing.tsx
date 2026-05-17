import React, { useEffect, useMemo, useState } from 'react';
import { IndianRupee, Percent, Save, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { readApiResponse } from '../utils/apiResponse';

interface PricingRules {
  surge_threshold: number;
  surge_multiplier: number;
  weekend_multiplier: number;
  season_multiplier: number;
  season_enabled: number;
}

interface PricingRoom {
  room_id: number;
  room_number: string;
  type: string;
  status: string;
  base_price: number;
  dynamic_price: number;
  multiplier: number;
  reasons: { weekend: boolean; surge: boolean; season: boolean };
}

interface PricingResponse {
  rules: PricingRules;
  occupancy: { totalRooms: number; occupiedRooms: number; occupancyRate: number };
  rooms: PricingRoom[];
  error?: string;
}

const formatCurrency = (value: number) => value.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export const DynamicPricing: React.FC = () => {
  const [rules, setRules] = useState<PricingRules>({
    surge_threshold: 80,
    surge_multiplier: 1.25,
    weekend_multiplier: 1.15,
    season_multiplier: 1.1,
    season_enabled: 0
  });
  const [rooms, setRooms] = useState<PricingRoom[]>([]);
  const [occupancy, setOccupancy] = useState({ totalRooms: 0, occupiedRooms: 0, occupancyRate: 0 });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');

  const fetchPricing = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pricing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiResponse<PricingResponse>(response);
      if (!response.ok) throw new Error(data.error || 'Could not load pricing.');
      setRules(data.rules);
      setRooms(data.rooms);
      setOccupancy(data.occupancy);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load pricing.');
    }
  };

  useEffect(() => {
    void fetchPricing();
  }, []);

  const averageLift = useMemo(() => {
    if (rooms.length === 0) return 0;
    const lift = rooms.reduce((sum, room) => sum + (room.dynamic_price - room.base_price), 0);
    return Math.round(lift / rooms.length);
  }, [rooms]);

  const updateRule = (key: keyof PricingRules, value: number) => {
    setRules((current) => ({ ...current, [key]: value }));
  };

  const saveRules = async () => {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/pricing/rules`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rules)
      });
      const data = await readApiResponse<{ message?: string; error?: string; rules?: PricingRules }>(response);
      if (!response.ok) throw new Error(data.error || 'Could not save rules.');
      setMessage(data.message || 'Pricing rules saved.');
      await fetchPricing();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save pricing rules.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-[85vh] flex-1 overflow-y-auto rounded-3xl border border-white/60 bg-white/40 p-6 shadow-2xl backdrop-blur-3xl lg:p-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-black text-primary">Dynamic Pricing Engine</h2>
          <p className="mt-1 max-w-2xl font-medium text-on-surface-variant">
            Tune surge, weekend, and season multipliers while comparing each live price against its base rate.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Metric icon={Percent} label="Occupancy" value={`${occupancy.occupancyRate}%`} />
          <Metric icon={IndianRupee} label="Avg lift" value={`Rs ${formatCurrency(Math.max(0, averageLift))}`} />
        </div>
      </div>

      {message && <div className="mb-5 rounded-2xl border border-primary/10 bg-white/70 px-5 py-4 text-sm font-bold text-primary">{message}</div>}

      <section className="mb-8 grid gap-4 lg:grid-cols-5">
        <RuleInput label="Surge over occupancy" suffix="%" value={rules.surge_threshold} onChange={(value) => updateRule('surge_threshold', value)} />
        <RuleInput label="Surge multiplier" suffix="x" step={0.05} value={rules.surge_multiplier} onChange={(value) => updateRule('surge_multiplier', value)} />
        <RuleInput label="Weekend multiplier" suffix="x" step={0.05} value={rules.weekend_multiplier} onChange={(value) => updateRule('weekend_multiplier', value)} />
        <RuleInput label="Season multiplier" suffix="x" step={0.05} value={rules.season_multiplier} onChange={(value) => updateRule('season_multiplier', value)} />
        <div className="rounded-3xl border border-white/60 bg-white/70 p-5">
          <label className="flex h-full items-center justify-between gap-4">
            <span>
              <span className="block text-xs font-black uppercase tracking-widest text-primary/45">Season Demand</span>
              <span className="mt-1 block font-headline text-xl font-black text-primary">{rules.season_enabled ? 'Enabled' : 'Paused'}</span>
            </span>
            <input
              type="checkbox"
              checked={Boolean(rules.season_enabled)}
              onChange={(event) => updateRule('season_enabled', event.target.checked ? 1 : 0)}
              className="h-5 w-5 accent-primary"
            />
          </label>
        </div>
      </section>

      <div className="mb-6 flex justify-end">
        <button
          onClick={saveRules}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-black text-white shadow-lg shadow-primary/15 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Rules'}
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-sm">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/20 bg-surface-variant/30 text-xs uppercase tracking-widest text-primary/50">
              <th className="p-5 font-bold">Room</th>
              <th className="p-5 font-bold">Base Price</th>
              <th className="p-5 font-bold">Dynamic Price</th>
              <th className="p-5 font-bold">Multiplier</th>
              <th className="p-5 font-bold">Demand Signals</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.room_id} className="border-b border-outline-variant/10">
                <td className="p-5">
                  <p className="font-black text-primary">Room {room.room_number}</p>
                  <p className="text-sm font-bold text-primary/45">{room.type} · {room.status}</p>
                </td>
                <td className="p-5 font-bold text-primary/60">Rs {formatCurrency(room.base_price)}</td>
                <td className="p-5 font-black text-secondary">Rs {formatCurrency(room.dynamic_price)}</td>
                <td className="p-5">
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-sm font-black text-secondary">
                    <TrendingUp className="h-4 w-4" />
                    {room.multiplier}x
                  </span>
                </td>
                <td className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {room.reasons.surge && <Tag label="Surge" />}
                    {room.reasons.weekend && <Tag label="Weekend" />}
                    {room.reasons.season && <Tag label="Season" />}
                    {!room.reasons.surge && !room.reasons.weekend && !room.reasons.season && <span className="text-sm font-bold text-primary/40">Base demand</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl bg-white/70 px-5 py-3">
    <Icon className="mb-2 h-5 w-5 text-secondary" />
    <p className="font-headline text-2xl font-black text-primary">{value}</p>
    <p className="text-xs font-black uppercase tracking-widest text-primary/45">{label}</p>
  </div>
);

const RuleInput: React.FC<{ label: string; value: number; suffix: string; step?: number; onChange: (value: number) => void }> = ({ label, value, suffix, step = 1, onChange }) => (
  <label className="rounded-3xl border border-white/60 bg-white/70 p-5">
    <span className="block text-xs font-black uppercase tracking-widest text-primary/45">{label}</span>
    <div className="mt-3 flex items-center gap-2">
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-xl border border-primary/10 bg-white px-3 py-3 font-black text-primary outline-none"
      />
      <span className="font-black text-primary/50">{suffix}</span>
    </div>
  </label>
);

const Tag: React.FC<{ label: string }> = ({ label }) => (
  <span className="rounded-full bg-[#d6b16a]/20 px-3 py-1 text-xs font-black text-primary">{label}</span>
);

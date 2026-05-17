import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, History, Loader2, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { readApiResponse } from '../utils/apiResponse';

interface HousekeepingRoom {
  room_id: number;
  room_number: string;
  type: string;
  room_status: string;
  cleaning_status: 'Clean' | 'Dirty' | 'In-Progress';
  assigned_to?: string | null;
  last_cleaned_at?: string | null;
  updated_at?: string | null;
  history_count: number;
}

interface HistoryEntry {
  history_id: number;
  status: string;
  staff_name?: string | null;
  note?: string | null;
  created_at: string;
}

const statuses: HousekeepingRoom['cleaning_status'][] = ['Dirty', 'In-Progress', 'Clean'];

const statusStyle = {
  Clean: 'bg-emerald-100 text-emerald-800',
  Dirty: 'bg-red-100 text-red-800',
  'In-Progress': 'bg-amber-100 text-amber-800'
};

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded';

export const Housekeeping: React.FC = () => {
  const [rooms, setRooms] = useState<HousekeepingRoom[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<HousekeepingRoom | null>(null);
  const [filter, setFilter] = useState<'All' | HousekeepingRoom['cleaning_status']>('All');
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');

  const fetchRooms = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/housekeeping/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiResponse<HousekeepingRoom[] | { error?: string }>(response);
      if (!response.ok || !Array.isArray(data)) throw new Error(('error' in data && data.error) || 'Could not load rooms.');
      setRooms(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load housekeeping.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRooms();
  }, []);

  const summary = useMemo(
    () => ({
      dirty: rooms.filter((room) => room.cleaning_status === 'Dirty').length,
      progress: rooms.filter((room) => room.cleaning_status === 'In-Progress').length,
      clean: rooms.filter((room) => room.cleaning_status === 'Clean').length
    }),
    [rooms]
  );

  const visibleRooms = useMemo(
    () => rooms.filter((room) => filter === 'All' || room.cleaning_status === filter),
    [filter, rooms]
  );

  const updateStatus = async (room: HousekeepingRoom, status: HousekeepingRoom['cleaning_status']) => {
    setWorkingId(room.room_id);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/housekeeping/rooms/${room.room_id}/status`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, note: status === 'Clean' ? 'Room cleared for next guest.' : undefined })
      });
      const data = await readApiResponse<{ message?: string; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || 'Could not update room.');
      setMessage(data.message || 'Room updated.');
      await fetchRooms();
      if (selectedRoom?.room_id === room.room_id) await openHistory({ ...room, cleaning_status: status });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update status.');
    } finally {
      setWorkingId(null);
    }
  };

  const openHistory = async (room: HousekeepingRoom) => {
    setSelectedRoom(room);
    try {
      const response = await fetch(`${API_BASE_URL}/api/housekeeping/rooms/${room.room_id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiResponse<HistoryEntry[] | { error?: string }>(response);
      if (response.ok && Array.isArray(data)) setHistory(data);
    } catch {
      setHistory([]);
    }
  };

  return (
    <div className="h-[85vh] flex-1 overflow-y-auto rounded-3xl border border-white/60 bg-white/40 p-6 shadow-2xl backdrop-blur-3xl lg:p-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-black text-primary">Housekeeping Command</h2>
          <p className="mt-1 max-w-2xl font-medium text-on-surface-variant">
            Track clean, dirty, and active cleaning states across every room after checkout.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Metric label="Dirty" value={summary.dirty} tone="text-red-700" />
          <Metric label="In progress" value={summary.progress} tone="text-amber-700" />
          <Metric label="Clean" value={summary.clean} tone="text-emerald-700" />
        </div>
      </div>

      {message && <div className="mb-5 rounded-2xl border border-primary/10 bg-white/70 px-5 py-4 text-sm font-bold text-primary">{message}</div>}

      <div className="mb-5 flex flex-wrap gap-2">
        {(['All', ...statuses] as const).map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-2 text-sm font-black ${
              filter === item ? 'bg-primary text-white' : 'bg-white/70 text-primary/60 hover:text-primary'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <div className="col-span-full flex items-center justify-center gap-3 rounded-3xl bg-white/70 p-10 font-bold text-primary/60">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading housekeeping board...
            </div>
          ) : (
            visibleRooms.map((room) => (
              <article key={room.room_id} className="rounded-3xl border border-white/60 bg-white/75 p-5 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-headline text-2xl font-black text-primary">Room {room.room_number}</p>
                    <p className="text-sm font-bold text-primary/50">{room.type} · {room.room_status}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${statusStyle[room.cleaning_status]}`}>
                    {room.cleaning_status}
                  </span>
                </div>
                <p className="mb-5 text-sm font-semibold text-primary/55">Last cleaned: {formatDateTime(room.last_cleaned_at)}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateStatus(room, 'In-Progress')}
                    disabled={workingId === room.room_id}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-800 disabled:opacity-50"
                  >
                    <Clock3 className="h-4 w-4" />
                    Start
                  </button>
                  <button
                    onClick={() => updateStatus(room, 'Clean')}
                    disabled={workingId === room.room_id}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-800 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Cleaned
                  </button>
                  <button
                    onClick={() => openHistory(room)}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-black text-primary"
                  >
                    <History className="h-4 w-4" />
                    History
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="rounded-3xl border border-white/60 bg-white/70 p-5">
          <div className="mb-5 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-secondary" />
            <h3 className="font-headline text-xl font-black text-primary">Cleaning History</h3>
          </div>
          {selectedRoom ? (
            <div>
              <p className="mb-4 font-bold text-primary/55">Room {selectedRoom.room_number}</p>
              <div className="space-y-3">
                {history.length > 0 ? history.map((item) => (
                  <div key={item.history_id} className="rounded-2xl bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-black text-primary">{item.status}</span>
                      <span className="text-xs font-bold text-primary/45">{formatDateTime(item.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-primary/50">{item.note || item.staff_name || 'Status update'}</p>
                  </div>
                )) : <p className="text-sm font-bold text-primary/45">No history yet.</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm font-bold text-primary/45">Select a room to inspect cleaning events.</p>
          )}
        </aside>
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: number; tone: string }> = ({ label, value, tone }) => (
  <div className="rounded-2xl bg-white/70 px-5 py-3">
    <p className={`text-2xl font-black ${tone}`}>{value}</p>
    <p className="text-xs font-black uppercase tracking-widest text-primary/45">{label}</p>
  </div>
);

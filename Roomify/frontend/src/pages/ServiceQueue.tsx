import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { Bell, CheckCircle2, Clock,  Loader2, RefreshCw } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  'Pending':     'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'In Progress': 'bg-blue-100   text-blue-800   border border-blue-200',
  'Completed':   'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'Cancelled':   'bg-gray-100   text-gray-600   border border-gray-200',
};

const PRIORITY_STYLES: Record<string, string> = {
  High:   'bg-red-100   text-red-700   border border-red-200',
  Normal: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
  Low:    'bg-gray-50   text-gray-500   border border-gray-100',
};

const CATEGORY_EMOJI: Record<string, string> = {
  Housekeeping:      '🧹',
  'Food & Beverage': '☕',
  Maintenance:       '🔧',
  Concierge:         '🎩',
  General:           '🛎️',
};

export const ServiceQueue: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [filter,   setFilter]   = useState<string>('Pending');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/service-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRequests(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchRequests]);

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/service-requests/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) await fetchRequests();
    } catch { /* ignore */ }
    finally { setUpdating(null); }
  };

  const filters = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'];
  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const inProgressCount = requests.filter(r => r.status === 'In Progress').length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black text-primary font-headline">Service Queue</h1>
          <p className="text-primary/60 font-bold mt-1 tracking-widest uppercase text-sm">Live In-Room Requests</p>
        </div>
        <div className="flex items-center gap-3">
          {(pendingCount > 0 || inProgressCount > 0) && (
            <div className="flex gap-2">
              {pendingCount > 0 && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-black rounded-full border border-yellow-200 animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
              {inProgressCount > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-black rounded-full border border-blue-200">
                  {inProgressCount} In Progress
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => { setAutoRefresh(v => !v); fetchRequests(); }}
            className={`p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold ${
              autoRefresh ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-variant text-primary/50'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              filter === f
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white/60 text-primary/60 hover:bg-white hover:text-primary border border-white/40'
            }`}
          >
            {f}
            {f !== 'All' && (
              <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full">
                {requests.filter(r => r.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Request Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/40 rounded-3xl border border-white/60">
          <span className="text-5xl">✅</span>
          <p className="font-black text-primary mt-4">All clear! No {filter.toLowerCase()} requests.</p>
          <p className="text-primary/50 text-sm font-bold mt-1">The team is on top of everything.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(req => (
            <div
              key={req.request_id}
              className={`bg-white/60 backdrop-blur-xl rounded-2xl p-6 border transition-all hover:shadow-lg ${
                req.status === 'Pending' ? 'border-yellow-200/60' :
                req.status === 'In Progress' ? 'border-blue-200/60' : 'border-white/40 opacity-70'
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{CATEGORY_EMOJI[req.category] || '🛎️'}</span>
                  <div>
                    <p className="font-black text-primary text-lg leading-tight">{req.item}</p>
                    <p className="text-primary/50 text-xs font-bold mt-0.5">{req.category}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 rounded-md text-xs font-black uppercase ${STATUS_BADGE[req.status]}`}>
                    {req.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${PRIORITY_STYLES[req.priority]}`}>
                    {req.priority}
                  </span>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-4 mb-3 text-xs text-primary/50 font-bold">
                <span className="flex items-center gap-1">
                  <Bell className="w-3 h-3" /> Room {req.room_number}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(req.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                {req.guest_name && <span>👤 {req.guest_name}</span>}
              </div>

              {req.notes && (
                <p className="text-primary/70 text-sm font-medium bg-surface-variant/40 rounded-xl px-4 py-2 mb-4 italic">
                  "{req.notes}"
                </p>
              )}

              {/* Action buttons */}
              {req.status !== 'Completed' && req.status !== 'Cancelled' && (
                <div className="flex gap-2 mt-2">
                  {req.status === 'Pending' && (
                    <button
                      onClick={() => updateStatus(req.request_id, 'In Progress')}
                      disabled={updating === req.request_id}
                      className="flex-1 py-2 bg-blue-100 text-blue-800 rounded-xl text-xs font-black uppercase hover:bg-blue-200 transition-all flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50"
                    >
                      {updating === req.request_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                      Accept
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(req.request_id, 'Completed')}
                    disabled={updating === req.request_id}
                    className="flex-1 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black uppercase hover:bg-emerald-200 transition-all flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50"
                  >
                    {updating === req.request_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Done
                  </button>
                  <button
                    onClick={() => updateStatus(req.request_id, 'Cancelled')}
                    disabled={updating === req.request_id}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, CheckCircle2, Clock, AlertTriangle,
  BedDouble, Waves, Coffee, Snowflake, UtensilsCrossed,
  Wrench, Sparkles, Send, ChevronDown, ChevronUp
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface ServiceRequest {
  request_id: number;
  category:   string;
  item:       string;
  notes:      string;
  priority:   'Low' | 'Normal' | 'High';
  status:     'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  created_at: string;
  room_number?: string;
}

const SERVICE_PRESETS: { icon: React.ReactNode; label: string; category: string; priority: string }[] = [
  { icon: <BedDouble   className="w-5 h-5" />, label: 'Extra Towels',       category: 'Housekeeping', priority: 'Normal' },
  { icon: <Sparkles    className="w-5 h-5" />, label: 'Room Cleaning',       category: 'Housekeeping', priority: 'Normal' },
  { icon: <Coffee      className="w-5 h-5" />, label: 'Extra Pillows',       category: 'Housekeeping', priority: 'Low'    },
  { icon: <UtensilsCrossed className="w-5 h-5" />, label: 'Breakfast in Room', category: 'Food & Beverage', priority: 'Normal' },
  { icon: <Waves       className="w-5 h-5" />, label: 'Mineral Water',       category: 'Food & Beverage', priority: 'Low'    },
  { icon: <Snowflake   className="w-5 h-5" />, label: 'AC Not Working',      category: 'Maintenance',  priority: 'High'   },
  { icon: <Wrench      className="w-5 h-5" />, label: 'Fix Wi-Fi',           category: 'Maintenance',  priority: 'High'   },
  { icon: <Bell        className="w-5 h-5" />, label: 'Do Not Disturb',      category: 'General',      priority: 'Normal' },
];

const STATUS_BADGE: Record<string, string> = {
  'Pending':     'bg-yellow-500/20  text-yellow-300  border-yellow-500/30',
  'In Progress': 'bg-blue-500/20    text-blue-300    border-blue-500/30',
  'Completed':   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Cancelled':   'bg-gray-500/20    text-gray-400    border-gray-500/30',
};

const PRIORITY_DOT: Record<string, string> = {
  High:   'bg-red-500',
  Normal: 'bg-yellow-400',
  Low:    'bg-gray-400',
};

export const ServiceRequestPanel: React.FC<{
  authHeaders: () => Record<string, string>;
}> = ({ authHeaders }) => {
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [sending,    setSending]    = useState(false);
  const [msg,        setMsg]        = useState('');
  const [isError,    setIsError]    = useState(false);
  const [expanded,   setExpanded]   = useState(false);

  // Custom request form
  const [custom,    setCustom]    = useState('');
  const [notes,     setNotes]     = useState('');
  const [category,  setCategory]  = useState('General');
  const [priority,  setPriority]  = useState('Normal');
  const [showForm,  setShowForm]  = useState(false);

  const fetchMyRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/service-requests/mine`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [authHeaders]);

  useEffect(() => { fetchMyRequests(); }, [fetchMyRequests]);

  const submit = async (item: string, cat: string, pri: string, extra = '') => {
    setSending(true);
    setMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/service-requests`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, category: cat, notes: extra, priority: pri }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed.');
      setMsg(data.message || 'Request sent!');
      setIsError(false);
      setCustom(''); setNotes(''); setShowForm(false);
      await fetchMyRequests();
    } catch (e: any) {
      setMsg(e.message);
      setIsError(true);
    } finally {
      setSending(false);
    }
  };

  const pending   = myRequests.filter(r => r.status === 'Pending' || r.status === 'In Progress');
  const completed = myRequests.filter(r => r.status === 'Completed' || r.status === 'Cancelled');

  return (
    <div className="w-full">
      {/* Status message */}
      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 ${
          isError ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        }`}>
          {isError ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          {msg}
        </div>
      )}

      {/* Quick-Action Presets */}
      <div className="mb-5">
        <p className="text-xs font-black uppercase text-[#e7c987]/60 tracking-widest mb-3">Quick Requests</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SERVICE_PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => submit(preset.label, preset.category, preset.priority)}
              disabled={sending}
              className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-[#006B5C]/30 hover:border-[#00C9A7]/50 transition-all text-left group disabled:opacity-50 active:scale-95"
            >
              <span className="text-[#00C9A7] group-hover:scale-110 transition-transform flex-shrink-0">
                {preset.icon}
              </span>
              <span className="text-white text-xs font-bold leading-tight">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Request Form */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 text-[#e7c987]/70 text-sm font-bold hover:text-[#e7c987] transition-colors mb-3"
        >
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showForm ? 'Hide custom request' : '+ Custom request'}
        </button>

        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 animate-fade-in">
            <input
              type="text"
              placeholder="What do you need? e.g. Extra blanket, Iron board..."
              value={custom}
              onChange={e => setCustom(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#00C9A7]/60 transition-colors"
            />
            <textarea
              placeholder="Any additional notes (optional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#00C9A7]/60 transition-colors resize-none"
            />
            <div className="flex gap-3">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="flex-1 bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none"
              >
                {['General','Housekeeping','Food & Beverage','Maintenance','Concierge'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="flex-1 bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none"
              >
                {['Low','Normal','High'].map(p => <option key={p} value={p}>{p} Priority</option>)}
              </select>
            </div>
            <button
              onClick={() => { if (custom.trim()) submit(custom.trim(), category, priority, notes.trim()); }}
              disabled={!custom.trim() || sending}
              className="w-full py-2.5 bg-gradient-to-r from-[#006B5C] to-[#00C9A7] rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[#006B5C]/30"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending…' : 'Send Request'}
            </button>
          </div>
        )}
      </div>

      {/* Active Requests */}
      {loading ? (
        <p className="text-white/40 text-sm font-bold text-center py-4">Loading requests…</p>
      ) : (
        <div className="space-y-2">
          {pending.length > 0 && (
            <div>
              <p className="text-xs font-black uppercase text-[#e7c987]/60 tracking-widest mb-2 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Active ({pending.length})
              </p>
              {pending.map(r => (
                <div key={r.request_id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[r.priority]}`}></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{r.item}</p>
                    <p className="text-white/40 text-xs">{r.category} · {new Date(r.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border ${STATUS_BADGE[r.status]}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-2 text-xs font-black uppercase text-[#e7c987]/40 tracking-widest mt-3 mb-2 hover:text-[#e7c987]/60 transition-colors"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                History ({completed.length})
              </button>
              {expanded && completed.map(r => (
                <div key={r.request_id} className="p-3 rounded-xl bg-white/3 border border-white/5 flex items-center gap-3 opacity-60">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{r.item}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${STATUS_BADGE[r.status]}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {myRequests.length === 0 && (
            <p className="text-center text-white/30 text-sm font-bold py-6">No service requests yet.<br/>Use the quick buttons above! 🛎️</p>
          )}
        </div>
      )}
    </div>
  );
};

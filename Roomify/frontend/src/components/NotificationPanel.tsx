import React, { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

interface Notification {
  notification_id: number;
  type: string;
  title: string;
  message: string;
  icon: string;
  is_read: number;
  action_url: string | null;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  booking: 'bg-blue-100 text-blue-700',
  checkout: 'bg-emerald-100 text-emerald-700',
  alert: 'bg-amber-100 text-amber-700',
  success: 'bg-emerald-100 text-emerald-700',
  system: 'bg-violet-100 text-violet-700',
  info: 'bg-sky-100 text-sky-700',
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  // Poll every 30 seconds for badge count
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications`, { headers });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, { method: 'PUT', headers });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const clearAll = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/clear`, { method: 'DELETE', headers });
      setNotifications([]);
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const seedNotifications = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/seed`, { method: 'POST', headers });
      await fetchNotifications();
    } catch { /* ignore */ }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-[100] w-[min(420px,100vw)] bg-white/95 backdrop-blur-3xl shadow-[-20px_0_60px_rgba(0,0,0,0.12)] flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-6 border-b border-primary/10 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black text-primary font-headline">Notifications</h2>
            <p className="text-xs font-bold text-primary/50">{unreadCount} unread</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={seedNotifications} className="p-2 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all" title="Generate demo notifications">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
            </button>
            <button onClick={markAllRead} className="p-2 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all" title="Mark all as read">
              <span className="material-symbols-outlined text-sm">done_all</span>
            </button>
            <button onClick={clearAll} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all" title="Clear all">
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-surface-variant text-primary/50 hover:bg-outline-variant/30 transition-all">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && <p className="text-center py-8 text-primary/40 font-bold">Loading...</p>}
          {!loading && notifications.length === 0 && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-primary/15 mb-4 block">notifications_off</span>
              <p className="font-bold text-primary/40">No notifications yet</p>
              <p className="text-xs text-primary/30 mt-1">Actions like check-ins and checkouts will appear here.</p>
              <button onClick={seedNotifications} className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-container transition-all">
                Generate Demo Notifications
              </button>
            </div>
          )}
          {notifications.map(n => (
            <div
              key={n.notification_id}
              className={`p-4 rounded-2xl border transition-all ${
                n.is_read ? 'bg-white border-outline-variant/15' : 'bg-secondary/5 border-secondary/20 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[n.type] || TYPE_COLORS.info}`}>
                  <span className="material-symbols-outlined text-sm">{n.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-black text-sm text-primary truncate">{n.title}</h4>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />}
                  </div>
                  <p className="text-xs text-primary/60 font-medium mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] font-bold text-primary/30 mt-1.5">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// ─── Bell Badge (for TopNavBar) ─────────────────────────────────────────────
export const NotificationBell: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch { /* ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button onClick={onClick} className="relative w-12 h-12 bg-white/70 backdrop-blur-md rounded-full flex items-center justify-center text-primary shadow-sm hover:bg-white transition-all">
      <span className="material-symbols-outlined">notifications</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-lg">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

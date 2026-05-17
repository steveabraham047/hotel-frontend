import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/analytics/logs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch audit logs');
        const data = await res.json();
        setLogs(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="p-10 font-bold">Loading audit logs...</div>;
  if (error) return <div className="p-10 text-red-500 font-bold">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-primary font-headline">Staff Activity Log</h1>
        <p className="text-primary/60 font-bold mt-2 tracking-widest uppercase text-sm">Security & Audit Trail</p>
      </div>

      <div className="bg-white/60 backdrop-blur-3xl rounded-3xl p-8 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-primary/10">
                <th className="py-4 px-4 text-xs font-black text-primary/40 uppercase tracking-widest">Time</th>
                <th className="py-4 px-4 text-xs font-black text-primary/40 uppercase tracking-widest">User</th>
                <th className="py-4 px-4 text-xs font-black text-primary/40 uppercase tracking-widest">Role</th>
                <th className="py-4 px-4 text-xs font-black text-primary/40 uppercase tracking-widest">Action</th>
                <th className="py-4 px-4 text-xs font-black text-primary/40 uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.log_id} className="border-b border-primary/5 hover:bg-white/40 transition-colors">
                  <td className="py-4 px-4 text-sm font-bold text-primary/60">
                    {new Date(log.created_at).toLocaleString('en-IN', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="py-4 px-4 text-sm font-black text-primary">{log.user_name}</td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-surface-variant text-primary rounded-md text-xs font-bold">
                      {log.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm font-bold text-emerald-700">{log.action}</td>
                  <td className="py-4 px-4 text-sm font-medium text-primary/70">{log.description}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-primary/40 font-bold">No activity logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

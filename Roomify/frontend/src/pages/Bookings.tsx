import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search,  Plus, X, History, FileText } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Premium', 'Family', 'Luxury'];
const bookingStatuses = ['Active', 'Completed', 'Cancelled', 'Pending', 'Confirmed'];

export const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  
  // Feature 19: Timeline Modal
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/guests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setBookings(data);
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const fetchHistory = async (booking: any) => {
    setSelectedBooking(booking);
    setHistoryLoading(true);
    setBookingHistory([]);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bookings/${booking.booking_id}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBookingHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.guest_name.toLowerCase().includes(term) ||
        b.room_number.toString().includes(term) ||
        b.booking_id.toString().includes(term) ||
        (b.email && b.email.toLowerCase().includes(term))
      );
    }
    if (statusFilter !== 'All') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }
    if (typeFilter !== 'All') {
      filtered = filtered.filter(b => b.room_type === typeFilter);
    }
    return filtered;
  }, [bookings, searchTerm, statusFilter, typeFilter]);

  return (
    <div className="flex-1 bg-gradient-to-br from-surface-variant/40 to-white/20 backdrop-blur-3xl rounded-3xl p-10 border border-white/60 shadow-2xl overflow-y-auto h-[85vh]">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-headline font-black text-primary">Master Directory</h2>
          <p className="text-on-surface-variant font-medium mt-1">Manage and review all active reservations.</p>
        </div>
        
        <button 
          onClick={() => navigate('/dashboard/new-booking')}
          className="bg-primary text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-primary-container transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Booking
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-primary/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, Guest, Room, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/60 border border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary/30 shadow-sm font-medium text-primary placeholder:text-primary/40 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-4 py-3 bg-white/60 border border-white/40 rounded-2xl text-primary font-bold text-sm outline-none cursor-pointer"
          >
            <option value="All">All Room Types</option>
            {roomTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white/60 border border-white/40 rounded-2xl text-primary font-bold text-sm outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            {bookingStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {!loading && (
        <p className="mb-4 text-sm font-bold text-primary/50">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </p>
      )}

      {/* Directory Table */}
      <div className="bg-white/70 rounded-3xl border border-white/60 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-variant/30 text-primary/50 text-xs uppercase tracking-widest border-b border-outline-variant/20">
              <th className="p-6 font-bold">ID</th>
              <th className="p-6 font-bold">Guest</th>
              <th className="p-6 font-bold">Room</th>
              <th className="p-6 font-bold">Dates</th>
              <th className="p-6 font-bold text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center font-bold text-primary/50">Loading database...</td></tr>
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map((b) => (
                <tr 
                  key={b.booking_id} 
                  className="border-b border-outline-variant/10 hover:bg-white/80 transition-colors group cursor-pointer"
                  onClick={() => fetchHistory(b)}
                >
                  <td className="p-6 font-medium text-primary/50 text-sm">BK-{b.booking_id.toString().padStart(4, '0')}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xs uppercase">
                        {b.guest_name.substring(0, 2)}
                      </div>
                      <span className="font-bold text-primary">{b.guest_name}</span>
                    </div>
                  </td>
                  <td className="p-6 font-bold text-primary">{b.room_number} <span className="text-xs text-primary/50 font-medium block">{b.room_type}</span></td>
                  <td className="p-6 text-sm font-medium text-primary/70">
                    {new Date(b.check_in).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} 
                    <span className="mx-2 text-primary/30">→</span> 
                    {new Date(b.check_out).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider
                      ${b.status === 'Active' ? 'bg-cyan-100 text-cyan-800' : 
                        b.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 
                        b.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-surface-variant text-on-surface-variant'}`}>
                      {b.status === 'Active' ? 'Confirmed' : b.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="p-10 text-center font-medium text-primary/50">No bookings found matching your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* TIER 4: Booking Timeline Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative border border-white/20">
            <button 
              onClick={() => setSelectedBooking(null)}
              className="absolute top-6 right-6 text-primary/40 hover:text-red-500 transition-colors bg-surface-variant/50 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
                 <History className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-headline font-black text-primary">Booking Timeline</h3>
                <p className="text-primary/60 text-xs font-bold uppercase tracking-widest mt-1">BK-{selectedBooking.booking_id.toString().padStart(4, '0')} • {selectedBooking.guest_name}</p>
              </div>
            </div>

            <div className="bg-surface-variant/30 rounded-2xl p-6 border border-outline-variant/20 max-h-80 overflow-y-auto">
               {historyLoading ? (
                  <p className="text-center font-bold text-primary/50 py-4">Loading history...</p>
               ) : bookingHistory.length > 0 ? (
                  <div className="relative border-l-2 border-secondary/30 ml-3 space-y-6">
                     {bookingHistory.map((event, index) => (
                        <div key={index} className="relative pl-6">
                           <div className="absolute w-3 h-3 bg-secondary rounded-full -left-[7px] top-1.5 shadow-[0_0_10px_rgba(0,201,167,0.5)]"></div>
                           <p className="text-xs font-black text-primary/40 mb-1">{new Date(event.created_at).toLocaleString()}</p>
                           <p className="text-sm font-bold text-primary">{event.status}</p>
                           <p className="text-sm text-primary/70">{event.notes}</p>
                           <p className="text-xs text-primary/40 italic mt-1">By {event.created_by}</p>
                        </div>
                     ))}
                  </div>
               ) : (
                  <p className="text-center font-bold text-primary/50 py-4">No history recorded.</p>
               )}
            </div>

            {/* Feature 11: Digital Boarding Pass trigger */}
            <div className="mt-6 pt-6 border-t border-outline-variant/20 flex gap-4">
               <button 
                 onClick={() => window.open(`/dashboard/bookings/${selectedBooking.booking_id}/boarding-pass`, '_blank')}
                 className="flex-1 py-3 bg-secondary text-white font-bold tracking-widest uppercase rounded-2xl hover:bg-secondary-container transition-all text-sm flex items-center justify-center gap-2 shadow-lg"
               >
                 <FileText className="w-4 h-4" />
                 Boarding Pass
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
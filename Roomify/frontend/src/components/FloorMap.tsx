import React, { useState } from 'react';

interface Room {
  room_id: number;
  room_number: string;
  type: string;
  status: string;
  price_per_night: number;
}

interface FloorMapProps {
  rooms: Room[];
  onAction: (room: Room, action: 'checkin' | 'checkout' | 'maintenance' | 'available') => void;
}

const STATUS_CONFIG: Record<string, { bg: string; border: string; text: string; glow: string; icon: string }> = {
  available: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', glow: 'shadow-emerald-200/40', icon: 'check_circle' },
  occupied:  { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', glow: 'shadow-red-200/40', icon: 'person' },
  maintenance: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', glow: 'shadow-amber-200/40', icon: 'build' },
};

const getConfig = (status: string) => STATUS_CONFIG[status.toLowerCase()] || STATUS_CONFIG.available;

export const FloorMap: React.FC<FloorMapProps> = ({ rooms, onAction }) => {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied' | 'maintenance'>('all');

  const filteredRooms = filter === 'all' ? rooms : rooms.filter(r => r.status.toLowerCase() === filter);

  const totalRooms = rooms.length;
  const availableCount = rooms.filter(r => r.status.toLowerCase() === 'available').length;
  const occupiedCount = rooms.filter(r => r.status.toLowerCase() === 'occupied').length;
  const maintenanceCount = rooms.filter(r => r.status.toLowerCase() === 'maintenance').length;

  return (
    <section className="mt-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h3 className="text-3xl font-extrabold text-primary font-headline leading-tight">Floor Map</h3>
          <p className="text-primary/60 font-medium mt-1">Interactive visual room manager — click any room for quick actions</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'available', 'occupied', 'maintenance'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filter === f
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white/60 text-primary/50 hover:bg-white hover:text-primary'
              }`}
            >
              {f === 'all' ? `All (${totalRooms})` : f === 'available' ? `Open (${availableCount})` : f === 'occupied' ? `Occupied (${occupiedCount})` : `Maint. (${maintenanceCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Floor Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredRooms.map(room => {
          const cfg = getConfig(room.status);
          return (
            <button
              key={room.room_id}
              onClick={() => setSelectedRoom(room)}
              className={`relative p-5 rounded-2xl border-2 ${cfg.border} ${cfg.bg} hover:scale-[1.03] active:scale-95 transition-all duration-200 shadow-lg ${cfg.glow} text-left group`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`material-symbols-outlined text-lg ${cfg.text}`}>{cfg.icon}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider ${cfg.text} px-2 py-0.5 rounded-full ${cfg.bg} border ${cfg.border}`}>
                  {room.status}
                </span>
              </div>
              <h4 className="text-xl font-black text-primary font-headline">{room.room_number}</h4>
              <p className="text-xs font-bold text-primary/50 mt-0.5">{room.type}</p>
              <p className="text-sm font-black text-secondary mt-2">₹{Number(room.price_per_night).toLocaleString('en-IN')}</p>
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/0 group-hover:border-primary/20 transition-all" />
            </button>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12 bg-white/40 rounded-3xl border border-white/40">
          <span className="material-symbols-outlined text-5xl text-primary/15 mb-3 block">hotel</span>
          <p className="font-bold text-primary/40">No rooms match this filter</p>
        </div>
      )}

      {/* Quick Action Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md" onClick={() => setSelectedRoom(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-primary font-headline">Room {selectedRoom.room_number}</h3>
                <p className="text-sm font-bold text-primary/50">{selectedRoom.type} • ₹{Number(selectedRoom.price_per_night).toLocaleString('en-IN')}/night</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase ${getConfig(selectedRoom.status).text} ${getConfig(selectedRoom.status).bg} border ${getConfig(selectedRoom.status).border}`}>
                {selectedRoom.status}
              </span>
            </div>

            <div className="space-y-3">
              {(selectedRoom.status.toLowerCase() === 'available') && (
                <button
                  onClick={() => { onAction(selectedRoom, 'checkin'); setSelectedRoom(null); }}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined">login</span> Book / Check-In
                </button>
              )}
              {(selectedRoom.status.toLowerCase() === 'occupied') && (
                <button
                  onClick={() => { onAction(selectedRoom, 'checkout'); setSelectedRoom(null); }}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined">logout</span> Manage Check-out
                </button>
              )}
              {selectedRoom.status.toLowerCase() !== 'maintenance' && (
                <button
                  onClick={() => { onAction(selectedRoom, 'maintenance'); setSelectedRoom(null); }}
                  className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border border-amber-200"
                >
                  <span className="material-symbols-outlined text-sm">build</span> Set Maintenance
                </button>
              )}
              {selectedRoom.status.toLowerCase() === 'maintenance' && (
                <button
                  onClick={() => { onAction(selectedRoom, 'available'); setSelectedRoom(null); }}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined">check_circle</span> Mark Available
                </button>
              )}
            </div>

            <button onClick={() => setSelectedRoom(null)} className="w-full mt-3 py-3 text-primary/50 font-bold hover:text-primary transition-all">
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

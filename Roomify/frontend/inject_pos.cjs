const fs = require('fs');
const path = 'src/pages/RestaurantPOS.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Add new import icons
c = c.replace(
  `import { Coffee, Flame, Minus, Plus, Receipt, Search, Sparkles, Utensils, CheckCircle2, Trash2, Save } from 'lucide-react';`,
  `import { Coffee, Flame, Minus, Plus, Receipt, Search, Sparkles, Utensils, CheckCircle2, Trash2, Save, Bell, BedDouble, CheckCheck, RefreshCw, Clock } from 'lucide-react';`
);

// 2. Add RoomOrder interface after CartItem interface
c = c.replace(
  `interface Room {`,
  `interface RoomOrder {
  order_id: number;
  total_amount: number;
  status: string;
  order_type: string;
  created_at: string;
  room_number: string;
  guest_name: string;
  guest_phone: string;
  notes: string | null;
}

interface Room {`
);

// 3. Add state variables after isAdmin line
c = c.replace(
  `  const userRole = (localStorage.getItem('role') || '').toLowerCase();
  const isAdmin = userRole === 'admin';`,
  `  const userRole = (localStorage.getItem('role') || '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const [activeTab, setActiveTab] = useState<'pos' | 'room-orders'>('pos');
  const [roomOrders, setRoomOrders] = useState<RoomOrder[]>([]);
  const [roomOrdersLoading, setRoomOrdersLoading] = useState(false);
  const [servingId, setServingId] = useState<number | null>(null);
  const [roomOrderMsg, setRoomOrderMsg] = useState('');`
);

// 4. Add fetchRoomOrders function before handlePlaceOrder
c = c.replace(
  `  const handlePlaceOrder = async () => {`,
  `  const fetchRoomOrders = async () => {
    setRoomOrdersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(\`\${API_BASE_URL}/api/restaurant/room-orders\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (res.ok) setRoomOrders(await res.json());
    } catch { /* ignore */ }
    finally { setRoomOrdersLoading(false); }
  };

  const handleServeOrder = async (orderId: number) => {
    setServingId(orderId);
    setRoomOrderMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(\`\${API_BASE_URL}/api/restaurant/room-orders/\${orderId}/serve\`, {
        method: 'PATCH',
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (res.ok) {
        setRoomOrderMsg('✅ Order marked as served. Charge is on the room bill.');
        await fetchRoomOrders();
      }
    } catch { /* ignore */ }
    finally { setServingId(null); }
  };

  // Auto-refresh room orders every 30s when on that tab
  useEffect(() => {
    if (activeTab !== 'room-orders') return;
    fetchRoomOrders();
    const interval = setInterval(fetchRoomOrders, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handlePlaceOrder = async () => {`
);

// 5. Add tab switcher after the outer <div> opening and before the left panel
const OLD_HEADER = `  return (
    <div className="flex flex-col lg:flex-row h-[85vh] gap-6">
      <div className="flex-[2] flex flex-col bg-white/40 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg overflow-hidden">
        <div className="p-5 bg-white/40 border-b border-white/40">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-2xl font-headline font-black text-primary">Restaurant POS</h2>`;

const NEW_HEADER = `  return (
    <div className="flex flex-col gap-4">
      {/* ── Tab Switcher ── */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab('pos')}
          className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all \${
            activeTab === 'pos'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-white/60 text-primary/60 hover:text-primary hover:bg-white border border-white/40'
          }\`}
        >
          <Utensils className="w-4 h-4" /> POS Terminal
        </button>
        <button
          onClick={() => { setActiveTab('room-orders'); fetchRoomOrders(); }}
          className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all relative \${
            activeTab === 'room-orders'
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
              : 'bg-white/60 text-primary/60 hover:text-primary hover:bg-white border border-white/40'
          }\`}
        >
          <Bell className="w-4 h-4" /> Room Orders
          {roomOrders.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
              {roomOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Room Orders Panel ── */}
      {activeTab === 'room-orders' && (
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-headline font-black text-primary">Guest Room Orders</h2>
              <p className="text-primary/50 text-sm font-bold">Food ordered via guest portal — pending delivery</p>
            </div>
            <button onClick={fetchRoomOrders} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 text-amber-800 text-xs font-black uppercase hover:bg-amber-200 transition-all">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {roomOrderMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold">
              {roomOrderMsg}
            </div>
          )}

          {roomOrdersLoading ? (
            <div className="text-center py-12 text-primary/40 font-bold">Loading orders…</div>
          ) : roomOrders.length === 0 ? (
            <div className="text-center py-16 bg-white/40 rounded-2xl border border-white/60">
              <span className="text-5xl block mb-3">🍽️</span>
              <p className="font-black text-primary">No pending room orders!</p>
              <p className="text-primary/50 text-sm font-bold mt-1">When guests order food from their portal, it appears here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {roomOrders.map(order => (
                <div key={order.order_id} className="bg-white/70 rounded-2xl border border-amber-200/60 p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <BedDouble className="w-5 h-5 text-amber-700" />
                      </div>
                      <div>
                        <p className="font-black text-primary text-lg">Room {order.room_number}</p>
                        <p className="text-primary/50 text-xs font-bold">{order.guest_name}</p>
                      </div>
                    </div>
                    <span className="text-emerald-700 font-black text-sm bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                      ₹{Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>

                  {order.notes && (
                    <div className="mb-3 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
                      <p className="text-xs font-black text-amber-800 uppercase tracking-wide mb-1">Items Ordered:</p>
                      <p className="text-sm text-amber-900 font-bold">{order.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-primary/40 font-bold mb-4">
                    <Clock className="w-3 h-3" />
                    {new Date(order.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <button
                    onClick={() => handleServeOrder(order.order_id)}
                    disabled={servingId === order.order_id}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <CheckCheck className="w-4 h-4" />
                    {servingId === order.order_id ? 'Marking…' : 'Mark as Served → Bill to Room'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── POS Terminal ── */}
      {activeTab === 'pos' && <div className="flex flex-col lg:flex-row h-[85vh] gap-6">
      <div className="flex-[2] flex flex-col bg-white/40 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg overflow-hidden">
        <div className="p-5 bg-white/40 border-b border-white/40">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-2xl font-headline font-black text-primary">Restaurant POS</h2>`;

c = c.replace(OLD_HEADER, NEW_HEADER);

// 6. Close the extra conditional div at the end (before last </div>)
// Find the final closing tag of the outer div
c = c.replace(
  `    </div>\n  );\n}`,
  `    </div></div>}\n  );\n}`
);

fs.writeFileSync(path, c, 'utf8');
console.log('RestaurantPOS.tsx updated successfully!');

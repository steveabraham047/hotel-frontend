const fs = require('fs');
const path = 'src/pages/RestaurantPOS.tsx';
let c = fs.readFileSync(path, 'utf8');

// ─── 1. Insert missing state declarations after isAdmin line ───────────────
const AFTER_IS_ADMIN = `  const isAdmin = userRole === 'admin';`;
if (!c.includes('setRoomOrders')) {
  c = c.replace(
    AFTER_IS_ADMIN,
    `${AFTER_IS_ADMIN}
  const [activeTab, setActiveTab] = React.useState('pos');
  const [roomOrders, setRoomOrders] = React.useState([]);
  const [roomOrdersLoading, setRoomOrdersLoading] = React.useState(false);
  const [servingId, setServingId] = React.useState(null);
  const [roomOrderMsg, setRoomOrderMsg] = React.useState('');`
  );
  console.log('State declarations added.');
} else {
  console.log('State already present, skipping state injection.');
}

// ─── 2. Wrap the big return with tabs ─────────────────────────────────────
// Find "return (" that starts the final return (not the isSuccess one)
// The isSuccess return is followed by ); and then the main return
const MAIN_RETURN_MARKER = `  }\n\n  return (\n    <div className="flex flex-col lg:flex-row h-[85vh] gap-6">`;
const NEW_RETURN = `  }\n\n  return (\n    <div className="flex flex-col gap-4">\n      {/* Tab Switcher */}\n      <div className="flex gap-3 mb-2">\n        <button onClick={() => setActiveTab('pos')} className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all \${activeTab === 'pos' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/60 text-primary/60 border border-white/40 hover:bg-white'}\`}>\n          <Utensils className="w-4 h-4" /> POS Terminal\n        </button>\n        <button onClick={() => { setActiveTab('room-orders'); fetchRoomOrders(); }} className={\`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all \${activeTab === 'room-orders' ? 'bg-amber-500 text-white' : 'bg-white/60 text-primary/60 border border-white/40 hover:bg-white'}\`}>\n          <Bell className="w-4 h-4" /> Room Orders\n          {roomOrders.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">{roomOrders.length}</span>}\n        </button>\n      </div>\n\n      {/* Room Orders Panel */}\n      {activeTab === 'room-orders' && (\n        <div className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg p-6">\n          <div className="flex items-center justify-between mb-5">\n            <div>\n              <h2 className="text-2xl font-headline font-black text-primary">Guest Room Orders</h2>\n              <p className="text-primary/50 text-sm font-bold">Food ordered via the guest portal — pending delivery</p>\n            </div>\n            <button onClick={fetchRoomOrders} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 text-amber-800 text-xs font-black uppercase hover:bg-amber-200 transition-all"><RefreshCw className="w-3 h-3" /> Refresh</button>\n          </div>\n          {roomOrderMsg && <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold">{roomOrderMsg}</div>}\n          {roomOrdersLoading ? (\n            <div className="text-center py-12 text-primary/40 font-bold">Loading orders…</div>\n          ) : roomOrders.length === 0 ? (\n            <div className="text-center py-16 bg-white/40 rounded-2xl border border-white/60">\n              <span className="text-5xl block mb-3">🍽️</span>\n              <p className="font-black text-primary">No pending room orders!</p>\n              <p className="text-primary/50 text-sm font-bold mt-1">When guests order food from their portal, it appears here.</p>\n            </div>\n          ) : (\n            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">\n              {roomOrders.map((order) => (\n                <div key={order.order_id} className="bg-white/70 rounded-2xl border border-amber-200/60 p-5 shadow-sm">\n                  <div className="flex items-start justify-between mb-3">\n                    <div className="flex items-center gap-2">\n                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><BedDouble className="w-5 h-5 text-amber-700" /></div>\n                      <div>\n                        <p className="font-black text-primary text-lg">Room {order.room_number}</p>\n                        <p className="text-primary/50 text-xs font-bold">{order.guest_name}</p>\n                      </div>\n                    </div>\n                    <span className="text-emerald-700 font-black text-sm bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">₹{Number(order.total_amount).toFixed(2)}</span>\n                  </div>\n                  {order.notes && (\n                    <div className="mb-3 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">\n                      <p className="text-xs font-black text-amber-800 uppercase tracking-wide mb-1">Items Ordered:</p>\n                      <p className="text-sm text-amber-900 font-bold">{order.notes}</p>\n                    </div>\n                  )}\n                  <div className="flex items-center gap-2 text-xs text-primary/40 font-bold mb-4"><Clock className="w-3 h-3" />{new Date(order.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>\n                  <button onClick={() => handleServeOrder(order.order_id)} disabled={servingId === order.order_id} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">\n                    <CheckCheck className="w-4 h-4" />{servingId === order.order_id ? 'Marking…' : 'Mark Served → Bill to Room'}\n                  </button>\n                </div>\n              ))}\n            </div>\n          )}\n        </div>\n      )}\n\n      {/* POS Terminal */}\n      {activeTab === 'pos' && <div className="flex flex-col lg:flex-row h-[85vh] gap-6">`;

if (c.includes(MAIN_RETURN_MARKER.replace(/\n/g, '\r\n')) || c.includes(MAIN_RETURN_MARKER)) {
  c = c.replace(MAIN_RETURN_MARKER, NEW_RETURN);
  console.log('Return wrapped with tabs.');
} else {
  // Try with just the simpler marker
  const SIMPLE_MARKER = 'return (\n    <div className="flex flex-col lg:flex-row h-[85vh] gap-6">';
  const SIMPLE_MARKER_CRLF = 'return (\r\n    <div className="flex flex-col lg:flex-row h-[85vh] gap-6">';
  if (c.includes(SIMPLE_MARKER_CRLF)) {
    c = c.replace(SIMPLE_MARKER_CRLF, `return (\r\n    <div className="flex flex-col gap-4">\r\n      {activeTab === 'pos' && <div className="flex flex-col lg:flex-row h-[85vh] gap-6">`);
    console.log('Simpler return wrap applied (CRLF).');
  } else {
    console.error('RETURN MARKER NOT FOUND - file may already be modified');
  }
}

// ─── 3. Close the extra wrapping divs at the end ──────────────────────────
// The file ends with: </div>\n  );\n};
// We need to close the {activeTab === 'pos' && ...} conditional and the outer flex wrapper
const END_MARKER = '    </div>\n  );\n};';
const END_MARKER_CRLF = '    </div>\r\n  );\r\n};';
if (c.includes(END_MARKER_CRLF)) {
  c = c.replace(END_MARKER_CRLF, '    </div>}\n    </div>\n  );\n};');
  console.log('End closing tags fixed.');
} else if (c.includes(END_MARKER)) {
  c = c.replace(END_MARKER, '    </div>}\n    </div>\n  );\n};');
  console.log('End closing tags fixed (LF).');
} else {
  console.log('End marker not found - may already be modified.');
}

fs.writeFileSync(path, c, 'utf8');
console.log('Done! File written.');

const fs = require('fs');
const path = 'src/pages/RestaurantPOS.tsx';
let c = fs.readFileSync(path, 'utf8');
const lines = c.split('\n');

// Line 320 (0-indexed: 319) is "  return (" — the main return
// Line 321 (0-indexed: 320) is '    <div className="flex flex-col lg:flex-row h-[85vh] gap-6">'
console.log('Line 319:', JSON.stringify(lines[319]));
console.log('Line 320:', JSON.stringify(lines[320]));
console.log('Line 321:', JSON.stringify(lines[321]));

// The main return starts at index 319, goes to end of file at index 616 (last line = 617)
// We'll replace everything from line 320 onward (the content inside return)

const NEW_CONTENT = `  return (
    <div className="flex flex-col gap-4">

      {/* Tab Switcher */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab('pos')}
          className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all \${activeTab === 'pos' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/60 text-primary/60 border border-white/40 hover:bg-white hover:text-primary'}\`}
        >
          <Utensils className="w-4 h-4" /> POS Terminal
        </button>
        <button
          onClick={() => { setActiveTab('room-orders'); fetchRoomOrders(); }}
          className={\`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all \${activeTab === 'room-orders' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white/60 text-primary/60 border border-white/40 hover:bg-white hover:text-primary'}\`}
        >
          <Bell className="w-4 h-4" /> Room Orders
          {roomOrders.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
              {roomOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* Room Orders Panel */}
      {activeTab === 'room-orders' && (
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-headline font-black text-primary">Guest Room Orders</h2>
              <p className="text-primary/50 text-sm font-bold">Food ordered via the guest portal — pending delivery</p>
            </div>
            <button onClick={fetchRoomOrders} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 text-amber-800 text-xs font-black uppercase hover:bg-amber-200 transition-all">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {roomOrderMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold">{roomOrderMsg}</div>
          )}

          {roomOrdersLoading ? (
            <div className="text-center py-12 text-primary/40 font-bold">Loading orders\u2026</div>
          ) : roomOrders.length === 0 ? (
            <div className="text-center py-16 bg-white/40 rounded-2xl border border-white/60">
              <span className="text-5xl block mb-3">\ud83c\udf7d\ufe0f</span>
              <p className="font-black text-primary">No pending room orders!</p>
              <p className="text-primary/50 text-sm font-bold mt-1">When guests order food from their portal, it appears here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {roomOrders.map((order: RoomOrder) => (
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
                      \u20b9{Number(order.total_amount).toFixed(2)}
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
                    {servingId === order.order_id ? 'Marking\u2026' : 'Mark Served \u2192 Bill to Room'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* POS Terminal */}
      {activeTab === 'pos' && (
        <div className="flex flex-col lg:flex-row h-[85vh] gap-6">
        <div className="flex-[2] flex flex-col bg-white/40 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg overflow-hidden">
          <div className="p-5 bg-white/40 border-b border-white/40">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-2xl font-headline font-black text-primary">Restaurant POS</h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-black uppercase tracking-wider">
                  {itemCount} items
                </span>
                {isAdmin && (
                  <button
                    onClick={() => setShowAdminMenuEditor((current) => !current)}
                    className="px-3 py-1 rounded-full bg-primary text-white text-xs font-black uppercase tracking-wider"
                  >
                    {showAdminMenuEditor ? 'Close Admin' : 'Add Menu Item'}
                  </button>
                )}
              </div>
            </div>

            {isAdmin && showAdminMenuEditor && (
              <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-primary/60 mb-3">Admin Menu Editor</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={newItem.name}
                    onChange={(event) => setNewItem((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Dish name"
                    className="rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm font-semibold text-primary"
                  />
                  <input
                    value={newItem.price}
                    onChange={(event) => setNewItem((current) => ({ ...current, price: event.target.value }))}
                    placeholder="Price"
                    type="number"
                    min="0"
                    className="rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm font-semibold text-primary"
                  />
                  <select
                    value={newItem.category}
                    onChange={(event) => setNewItem((current) => ({ ...current, category: event.target.value as Exclude<MenuCategory, 'All' | 'Best Sellers'> }))}
                    className="rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm font-semibold text-primary"
                  >
                    <option value="Starters">Starters</option>
                    <option value="Mains">Mains</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                  <input
                    value={newItem.image_url}
                    onChange={(event) => setNewItem((current) => ({ ...current, image_url: event.target.value }))}
                    placeholder="Photo URL"
                    className="rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm font-semibold text-primary"
                  />
                  <textarea
                    value={newItem.description}
                    onChange={(event) => setNewItem((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Short description"
                    className="md:col-span-2 rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm font-semibold text-primary min-h-16"
                  />
                  <label className="flex items-center gap-2 text-sm font-bold text-primary">
                    <input type="checkbox" checked={newItem.is_bestseller} onChange={(event) => setNewItem((current) => ({ ...current, is_bestseller: event.target.checked }))} />
                    Best Seller
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-primary">
                    <input type="checkbox" checked={newItem.is_chef_pick} onChange={(event) => setNewItem((current) => ({ ...current, is_chef_pick: event.target.checked }))} />
                    Chef Recommendation
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-primary">
                    <input type="checkbox" checked={newItem.is_dessert_week} onChange={(event) => setNewItem((current) => ({ ...current, is_dessert_week: event.target.checked }))} />
                    Dessert of Week
                  </label>
                </div>
                <button
                  onClick={handleCreateMenuItem}
                  disabled={isSavingItem}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-white font-bold disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {isSavingItem ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            )}

            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search dishes..."
                className="w-full rounded-xl border border-white/50 bg-white/70 py-3 pl-11 pr-4 font-semibold text-primary outline-none"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {MENU_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={\`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all \${activeCategory === category ? 'bg-primary text-white shadow-md' : 'bg-white/70 text-primary/60 hover:bg-white hover:text-primary'}\`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar">
            {isLoadingMenu && (
              <div className="col-span-full text-center py-8 text-primary/50 font-bold">Loading menu...</div>
            )}
            {!isLoadingMenu && filteredMenu.map((item) => {
              const visualIcon = item.category === 'Drinks' ? Coffee : item.category === 'Desserts' ? Sparkles : Utensils;
              const Icon = visualIcon;
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="text-left bg-white/70 hover:bg-white p-5 rounded-2xl border border-white hover:border-secondary/30 shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      {item.bestseller && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase">
                          <Flame className="w-3 h-3" /> Best
                        </span>
                      )}
                      {item.chefPick && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                          <Sparkles className="w-3 h-3" /> Chef
                        </span>
                      )}
                      {item.dessertWeek && (
                        <span className="px-2 py-1 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black uppercase">Dessert</span>
                      )}
                    </div>
                  </div>
                  <h4 className="font-black text-primary mb-1">{item.name}</h4>
                  <p className="text-xs text-primary/50 font-bold uppercase">{item.category}</p>
                  {item.description && <p className="mt-2 text-xs text-primary/60 font-medium line-clamp-2">{item.description}</p>}
                  <p className="mt-3 text-secondary font-black text-lg">Rs {item.price}</p>
                </button>
              );
            })}
            {!isLoadingMenu && filteredMenu.length === 0 && (
              <div className="col-span-full text-center py-8 text-primary/50 font-bold">No menu items in this filter.</div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-outline-variant/15 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Receipt className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-headline font-bold text-primary">Current Order</h2>
            </div>
            <button
              onClick={clearCart}
              className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-red-600 text-xs font-bold hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-primary/30">
                <Utensils className="w-12 h-12 mb-2 opacity-50" />
                <p className="font-medium">Add dishes from the left menu</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-outline-variant/10 shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-primary">{item.name}</h4>
                      <span className="text-xs text-primary/60">Rs {item.price} x {item.qty}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-variant/30 p-1 rounded-lg border border-outline-variant/10">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-white rounded-md transition-colors">
                        <Minus className="w-4 h-4 text-primary" />
                      </button>
                      <span className="font-bold text-sm w-6 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-white rounded-md transition-colors">
                        <Plus className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white p-6 border-t border-outline-variant/15 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="flex bg-surface-variant/50 rounded-xl p-1 mb-4 border border-outline-variant/20">
              <button
                onClick={() => setOrderType('room')}
                className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all \${orderType === 'room' ? 'bg-white text-primary shadow-sm' : 'text-primary/50 hover:text-primary'}\`}
              >
                Room Charge
              </button>
              <button
                onClick={() => setOrderType('walk-in')}
                className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all \${orderType === 'walk-in' ? 'bg-white text-primary shadow-sm' : 'text-primary/50 hover:text-primary'}\`}
              >
                Walk-in
              </button>
            </div>

            {orderType === 'room' && (
              <div className="mb-4">
                <select
                  value={selectedRoom}
                  onChange={(event) => setSelectedRoom(event.target.value)}
                  className="w-full bg-surface-variant/30 border border-primary/10 rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-secondary/20 outline-none appearance-none font-medium"
                >
                  <option value="">Select Occupied Room...</option>
                  {occupiedRooms.map((room) => (
                    <option key={room.room_id} value={room.room_number}>Room {room.room_number}</option>
                  ))}
                </select>
              </div>
            )}

            <textarea
              value={orderNote}
              onChange={(event) => setOrderNote(event.target.value)}
              placeholder="Kitchen note (optional): no onion, extra spicy, allergy info..."
              className="w-full mb-4 min-h-16 rounded-xl border border-primary/10 bg-surface-variant/20 px-4 py-3 text-sm font-medium text-primary outline-none"
            />

            {statusMsg && (
              <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{statusMsg}</div>
            )}

            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-sm text-primary/60 font-medium">
                <span>Subtotal</span><span>Rs {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-primary/60 font-medium">
                <span>GST (5%)</span><span>Rs {tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-headline font-black text-primary pt-2 border-t border-outline-variant/20">
                <span>Total</span><span>Rs {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className={\`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg \${cart.length > 0 ? 'bg-secondary text-on-secondary hover:bg-secondary-container hover:scale-[1.01]' : 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed'} disabled:opacity-60\`}
            >
              {orderType === 'room' ? 'Send to Room Tab' : 'Process Walk-in Payment'}
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};
`;

// Replace from line 319 (index 319) to end
const before = lines.slice(0, 319).join('\n');
const result = before + '\n' + NEW_CONTENT;
fs.writeFileSync(path, result, 'utf8');
console.log('File rewritten. Total chars:', result.length);

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { BarChart, DonutChart, ChartLegend } from '../components/Charts';
import { FloorMap } from '../components/FloorMap';
import { InvoicePDF } from '../components/InvoicePDF';

export const Dashboard: React.FC = () => {
  // Room & API States
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Checkout & Invoice States
  const [checkoutRoom, setCheckoutRoom] = useState<any>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [finalInvoiceData, setFinalInvoiceData] = useState<any>(null);
  const [restaurantTab, setRestaurantTab] = useState(0);
  const [isFetchingTab, setIsFetchingTab] = useState(false);
  // Feature 2: Checkout Preview
  const [previewData, setPreviewData] = useState<any>(null);
  const [checkoutStep, setCheckoutStep] = useState<'preview' | 'confirm'>('preview');

  // Live Metrics & Modal State
  // Live Metrics & Modal State
  const [metrics, setMetrics] = useState({ arrivals: 0, hosted: 0, revenue: 0, roomRevenue: 0, posRevenue: 0 });
  const [chartData, setChartData] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false);
  const [showInvoicePdf, setShowInvoicePdf] = useState(false);
  
  const navigate = useNavigate();

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/');
      
      const roomRes = await fetch(`${API_BASE_URL}/api/rooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!roomRes.ok) throw new Error('Failed to fetch room data');
      const roomData = await roomRes.json();
      setRooms(roomData); 

      // Fetch Real Live Analytics
      // Fetch Real Live Analytics & Charts
      const [dashRes, chartsRes, insightsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/analytics/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/analytics/charts`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/analytics/insights`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (dashRes.ok) setMetrics(await dashRes.json());
      if (chartsRes.ok) setChartData(await chartsRes.json());
      if (insightsRes?.ok) setInsights(await insightsRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [navigate]);

  const handleOpenCheckout = async (room: any) => {
    setCheckoutRoom(room);
    setCheckoutStep('preview');
    setPreviewData(null);
    setRestaurantTab(0);
    setIsFetchingTab(true);
    setCheckoutError('');
    setCheckoutSuccess(false);
    setFinalInvoiceData(null);
    
    try {
      const token = localStorage.getItem('token');
      // Fetch restaurant tab
      const tabRes = await fetch(`${API_BASE_URL}/api/restaurant/tab/${room.room_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tabData = await tabRes.json();
      if (tabData.total) setRestaurantTab(tabData.total);

      // Feature 2: Fetch detailed checkout preview
      const bookingRes = await fetch(`${API_BASE_URL}/api/guests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allBookings = await bookingRes.json();
      const activeBooking = allBookings.find((b: any) => b.room_id === room.room_id && b.status === 'Active');
      
      if (activeBooking) {
        const previewRes = await fetch(`${API_BASE_URL}/api/invoices/preview/${activeBooking.booking_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (previewRes.ok) {
          const preview = await previewRes.json();
          setPreviewData(preview);
        }
      }
    } catch (err) {
      console.error("Failed to fetch checkout data", err);
    } finally {
      setIsFetchingTab(false);
    }
  };

  const handleProcessCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bookings/checkout/${checkoutRoom.room_id}`, {
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Checkout failed.');

      // Set the invoice data and show the success screen!
      setFinalInvoiceData(data.invoiceData);
      setCheckoutSuccess(true);
      await fetchRooms(); 
    } catch (err: any) {
      setCheckoutError(err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied' || r.status === 'OCCUPIED').length;
  const realOccupancyRate = totalRooms === 0 ? 0 : Math.round((occupiedRooms / totalRooms) * 100);

  if (loading) return <div className="p-10 text-white font-bold text-xl flex items-center gap-3"><span className="material-symbols-outlined animate-spin">sync</span> Loading live hotel data...</div>;
  if (error) return <div className="p-10 text-red-500 font-bold text-xl bg-red-50 rounded-2xl m-8 border border-red-200">Error: {error}</div>;

  return (
    <>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-4xl font-black text-primary font-headline">Command Center</h1>
          <p className="text-primary/60 font-bold mt-1">Live metrics and analytics</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.open(`${API_BASE_URL}/api/analytics/export/bookings?token=${localStorage.getItem('token')}`, '_blank')} className="px-4 py-2 bg-white/60 backdrop-blur-md rounded-xl text-xs font-black uppercase text-primary/70 hover:bg-white hover:text-primary transition-all flex items-center gap-2 shadow-sm border border-white/40">
            <span className="material-symbols-outlined text-sm">download</span> Bookings
          </button>
          <button onClick={() => window.open(`${API_BASE_URL}/api/analytics/export/invoices?token=${localStorage.getItem('token')}`, '_blank')} className="px-4 py-2 bg-white/60 backdrop-blur-md rounded-xl text-xs font-black uppercase text-primary/70 hover:bg-white hover:text-primary transition-all flex items-center gap-2 shadow-sm border border-white/40">
            <span className="material-symbols-outlined text-sm">download</span> Invoices
          </button>
        </div>
      </div>

      {/* --- UPGRADED PREMIUM METRICS ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        {/* Occupancy Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 blur-xl group-hover:bg-white/30 transition-all rounded-3xl"></div>
          <div className="relative bg-white/50 backdrop-blur-3xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-start mb-4">
              <span className="text-primary/70 font-bold text-sm uppercase tracking-widest">Occupancy Rate</span>
              <div className="p-2 bg-secondary/20 text-secondary rounded-xl backdrop-blur-md">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
            </div>
            <div className="text-6xl font-extrabold text-primary font-headline mb-2">{realOccupancyRate}%</div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span>Live Calculation</span>
            </div>
          </div>
        </div>

        {/* Hosted Guests Card */}
        <div className="relative group md:translate-y-4">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 blur-xl group-hover:bg-white/30 transition-all rounded-3xl"></div>
          <div className="relative bg-white/50 backdrop-blur-3xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-start mb-4">
              <span className="text-primary/70 font-bold text-sm uppercase tracking-widest">Currently Hosted</span>
              <div className="p-2 bg-primary/10 text-primary rounded-xl backdrop-blur-md">
                <span className="material-symbols-outlined">key</span>
              </div>
            </div>
            <div className="text-6xl font-extrabold text-primary font-headline mb-2">{metrics.hosted}</div>
            <div className="flex items-center gap-2 text-primary/50 font-bold text-sm">
              <span>Active rooms right now</span>
            </div>
          </div>
        </div>

        {/* --- CLICKABLE REVENUE CARD --- */}
        <div 
          onClick={() => setShowRevenueBreakdown(true)}
          className="relative group cursor-pointer active:scale-95 transition-transform"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 blur-xl group-hover:bg-white/30 transition-all rounded-3xl"></div>
          <div className="relative bg-white/50 backdrop-blur-3xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] group-hover:border-emerald-300">
            <div className="flex justify-between items-start mb-4">
              <span className="text-primary/70 font-bold text-sm uppercase tracking-widest">Total Revenue</span>
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl backdrop-blur-md">
                <span className="material-symbols-outlined">payments</span>
              </div>
            </div>
            <div className="text-5xl font-extrabold text-primary font-headline mb-2 truncate">
              ₹{metrics.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <span className="material-symbols-outlined text-sm">ads_click</span>
              <span>Click for breakdown</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- NEW TIER 1 CHARTS SECTION --- */}
      {chartData && (
        <section className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
            <h3 className="text-xl font-black text-primary font-headline mb-6">Revenue Timeline (7 Days)</h3>
            <BarChart 
              data={chartData.revenueTimeline.map((d: any) => ({ label: d.label, value: d.total_revenue }))}
              unit="₹"
            />
          </div>

          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] flex items-center justify-between">
             <div>
               <h3 className="text-xl font-black text-primary font-headline mb-2">Room Type Breakdown</h3>
               <p className="text-sm font-bold text-primary/50 mb-6">Current distribution</p>
               <ChartLegend items={chartData.roomTypeBreakdown.map((r: any, i: number) => ({
                 label: r.type,
                 value: r.count.toString(),
                 color: ['#006B5C', '#00C9A7', '#1D4ED8', '#8B5CF6'][i % 4]
               }))} />
             </div>
             <DonutChart 
               data={chartData.roomTypeBreakdown.map((r: any, i: number) => ({ 
                 label: r.type, 
                 value: r.count, 
                 color: ['#006B5C', '#00C9A7', '#1D4ED8', '#8B5CF6'][i % 4] 
               }))}
               centerValue={chartData.totalRooms?.toString()}
               centerLabel="TOTAL ROOMS"
             />
          </div>
        </section>
      )}

      {/* --- TIER 4: INSIGHTS & FORECASTING --- */}
      {insights && (
        <section className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] col-span-2">
            <h3 className="text-xl font-black text-primary font-headline mb-6">Revenue Forecast (30 Days)</h3>
            {insights.forecast.length > 0 ? (
              <BarChart 
                data={insights.forecast.map((f: any) => ({ 
                  label: new Date(f.day).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), 
                  value: f.expected_revenue,
                  color: 'linear-gradient(to top, #8B5CF6, #C4B5FD)'
                }))}
                unit="₹"
              />
            ) : (
               <p className="text-primary/50 font-bold text-sm">No upcoming bookings found to generate forecast.</p>
            )}
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
             <h3 className="text-xl font-black text-primary font-headline mb-2">Guest Segmentation</h3>
             <p className="text-sm font-bold text-primary/50 mb-6">Customer intelligence</p>
             <div className="space-y-4 mt-6">
                {insights.segmentation.map((seg: any) => {
                  const total = insights.segmentation.reduce((acc: number, curr: any) => acc + curr.count, 0);
                  const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
                  return (
                    <div key={seg.segment}>
                      <div className="flex justify-between text-sm font-black text-primary mb-1">
                        <span>{seg.segment}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-variant/50 rounded-full overflow-hidden">
                         <div className="h-full bg-secondary rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="text-right text-[10px] font-bold text-primary/40 mt-1">{seg.count} Guests</div>
                    </div>
                  );
                })}
             </div>
          </div>
        </section>
      )}

      {/* --- NEW TIER 1 FLOOR MAP --- */}
      <FloorMap 
        rooms={rooms}
        onAction={(room, action) => {
          if (action === 'checkin') navigate('/dashboard/new-booking');
          else if (action === 'checkout') handleOpenCheckout(room);
        }}
      />

      {/* --- CHECKOUT & INVOICE MODAL --- */}
      {checkoutRoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in print:bg-white print:p-0">
          
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-white/20 print:shadow-none print:border-none print:w-full print:max-w-full">
            
            <button 
              onClick={() => { setCheckoutRoom(null); setCheckoutSuccess(false); setFinalInvoiceData(null); }}
              className="absolute top-6 right-6 text-primary/40 hover:text-red-500 transition-colors bg-surface-variant/50 p-2 rounded-full print:hidden"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            {!checkoutSuccess ? (
              // --- TWO-STEP CHECKOUT: PREVIEW → CONFIRM ---
              <>
                <h2 className="text-3xl font-headline font-black text-primary mb-1">
                  {checkoutStep === 'preview' ? 'Checkout Preview' : 'Confirm Payment'}
                </h2>
                <p className="text-primary/60 font-bold text-sm mb-4 tracking-widest uppercase">Room {checkoutRoom.room_number} • {checkoutRoom.type}</p>

                {/* Step indicator */}
                <div className="flex gap-2 mb-6">
                  <div className={`flex-1 h-1.5 rounded-full ${checkoutStep === 'preview' ? 'bg-secondary' : 'bg-emerald-500'}`} />
                  <div className={`flex-1 h-1.5 rounded-full ${checkoutStep === 'confirm' ? 'bg-secondary' : 'bg-outline-variant/30'}`} />
                </div>

                {checkoutError && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {checkoutError}
                  </div>
                )}

                <div className="bg-surface-variant/40 rounded-2xl p-6 mb-6 border border-outline-variant/20 shadow-inner">
                  {isFetchingTab ? (
                    <p className="text-center font-bold text-primary/50 py-4">Loading breakdown...</p>
                  ) : previewData ? (
                    /* Feature 2: Detailed preview from API */
                    <>
                      {previewData.guest && (
                        <div className="mb-4 pb-4 border-b border-outline-variant/20">
                          <p className="text-xs font-bold uppercase text-primary/50 mb-1">Guest</p>
                          <p className="font-black text-primary">{previewData.guest.name}</p>
                          {previewData.guest.phone && <p className="text-xs text-primary/60">{previewData.guest.phone}</p>}
                        </div>
                      )}
                      <div className="flex justify-between mb-3 text-sm text-primary font-bold">
                        <span>Room Rate × {previewData.breakdown.nights} night(s)</span>
                        <span>₹{Math.round(previewData.breakdown.room_subtotal).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between mb-3 text-sm text-primary font-bold">
                        <span>Room GST (12%)</span>
                        <span>₹{Math.round(previewData.breakdown.room_tax).toLocaleString('en-IN')}</span>
                      </div>
                      {previewData.breakdown.food_orders?.length > 0 && (
                        <>
                          <p className="text-xs font-bold uppercase text-primary/50 mt-4 mb-2">Restaurant Orders</p>
                          {previewData.breakdown.food_orders.map((fo: any) => (
                            <div key={fo.order_id} className="flex justify-between mb-2 text-sm text-primary/80 font-medium">
                              <span>Order #{fo.order_id} ({fo.order_type || 'dine-in'})</span>
                              <span className={fo.status === 'Unpaid' ? 'text-secondary font-black' : 'text-primary/50'}>₹{Number(fo.total_amount).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                          <div className="flex justify-between mb-3 text-sm text-primary font-bold">
                            <span>Food GST (5%)</span>
                            <span>₹{Math.round(previewData.breakdown.food_tax).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}
                      {previewData.breakdown.hall_bookings?.length > 0 && (
                        <>
                          <p className="text-xs font-bold uppercase text-primary/50 mt-4 mb-2">Hall Bookings</p>
                          {previewData.breakdown.hall_bookings.map((h: any) => (
                            <div key={h.hall_booking_id} className="flex justify-between mb-2 text-sm text-primary/80 font-medium">
                              <span>{h.time_slot} — {new Date(h.event_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                              <span>₹{Number(h.flat_fee).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </>
                      )}
                      <div className="w-full h-px bg-outline-variant/40 my-5"></div>
                      <div className="flex justify-between text-2xl font-black text-primary font-headline items-center">
                        <span>Grand Total</span>
                        <span className="text-emerald-600 text-3xl">₹{Math.round(previewData.breakdown.grand_total).toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  ) : (
                    /* Fallback simple view */
                    <>
                      <div className="flex justify-between mb-4 text-sm text-primary font-bold">
                        <span>Base Rate (1 Night)</span>
                        <span>₹{Number(checkoutRoom.price_per_night).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between mb-4 text-sm text-primary font-bold">
                        <span>Hotel Taxes (12%)</span>
                        <span>₹{Math.round(checkoutRoom.price_per_night * 0.12).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between mb-4 text-sm text-primary font-bold">
                        <span>Restaurant Charges</span>
                        <span className={restaurantTab > 0 ? 'text-secondary font-black' : 'text-primary/50'}>₹{Number(restaurantTab).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full h-px bg-outline-variant/40 my-6"></div>
                      <div className="flex justify-between text-2xl font-black text-primary font-headline items-center">
                        <span>Total Due</span>
                        <span className="text-emerald-600 text-3xl">₹{(Math.round(checkoutRoom.price_per_night * 1.12) + Number(restaurantTab)).toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}
                </div>

                {checkoutStep === 'preview' ? (
                  <button 
                    onClick={() => setCheckoutStep('confirm')}
                    disabled={isFetchingTab}
                    className="w-full py-4 bg-secondary hover:bg-secondary-container text-white font-bold tracking-widest uppercase rounded-2xl flex justify-center items-center gap-2 transition-all shadow-xl disabled:opacity-50 active:scale-95"
                  >
                    <span className="material-symbols-outlined">arrow_forward</span>
                    Proceed to Payment
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setCheckoutStep('preview')}
                      className="flex-1 py-4 bg-surface-variant text-primary font-bold tracking-widest uppercase rounded-2xl hover:bg-outline-variant/30 transition-all"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleProcessCheckout}
                      disabled={isCheckingOut}
                      className="flex-1 py-4 bg-primary hover:bg-primary-container text-white font-bold tracking-widest uppercase rounded-2xl flex justify-center items-center gap-2 transition-all shadow-xl disabled:opacity-50 active:scale-95"
                    >
                      <span className="material-symbols-outlined">receipt_long</span>
                      {isCheckingOut ? 'Processing...' : 'Confirm & Pay'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              // --- SUCCESS & PRINT VIEW ---
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 print:hidden">
                  <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
                </div>
                
                <h2 className="text-3xl font-headline font-black text-primary mb-1">Payment Successful</h2>
                <p className="text-primary/60 font-bold text-sm mb-8 tracking-widest uppercase">{finalInvoiceData?.invoiceNo}</p>

                <div className="bg-white border-2 border-outline-variant/30 rounded-2xl p-6 text-left mb-8 print:border-none print:p-0">
                   <h3 className="font-black text-primary mb-4 border-b pb-2">Invoice Summary</h3>
                   <div className="flex justify-between text-sm mb-2 font-medium"><span>Room Subtotal</span> <span>₹{finalInvoiceData?.roomSubtotal.toLocaleString('en-IN')}</span></div>
                   <div className="flex justify-between text-sm mb-2 font-medium"><span>Restaurant</span> <span>₹{finalInvoiceData?.foodTotal.toLocaleString('en-IN')}</span></div>
                   <div className="flex justify-between text-sm mb-2 font-medium"><span>Total Taxes</span> <span>₹{finalInvoiceData?.taxes.toLocaleString('en-IN')}</span></div>
                   <div className="w-full h-px bg-outline-variant/40 my-4"></div>
                   <div className="flex justify-between font-black text-xl text-primary"><span>Grand Total</span> <span>₹{finalInvoiceData?.grandTotal.toLocaleString('en-IN')}</span></div>
                </div>

                <div className="flex gap-4 print:hidden">
                  <button 
                    onClick={() => setShowInvoicePdf(true)}
                    className="flex-1 py-4 bg-secondary hover:bg-secondary-container text-white font-bold tracking-widest uppercase rounded-2xl flex justify-center items-center gap-2 transition-all shadow-xl active:scale-95"
                  >
                    <span className="material-symbols-outlined">print</span>
                    Download PDF
                  </button>
                  <button 
                    onClick={() => { setCheckoutRoom(null); setCheckoutSuccess(false); setFinalInvoiceData(null); setPreviewData(null); setCheckoutStep('preview'); }}
                    className="flex-1 py-4 bg-surface-variant text-primary font-bold tracking-widest uppercase rounded-2xl hover:bg-outline-variant/30 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- REVENUE BREAKDOWN MODAL --- */}
      {showRevenueBreakdown && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-white/20">
            <button 
              onClick={() => setShowRevenueBreakdown(false)}
              className="absolute top-6 right-6 text-primary/40 hover:text-red-500 transition-colors bg-surface-variant/50 p-2 rounded-full"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl text-emerald-600">bar_chart</span>
            </div>

            <h2 className="text-3xl font-headline font-black text-primary mb-1">Revenue Breakdown</h2>
            <p className="text-primary/60 font-bold text-sm mb-8 tracking-widest uppercase">Verified from Database</p>

            <div className="bg-surface-variant/40 rounded-2xl p-6 mb-8 border border-outline-variant/20">
              <div className="flex justify-between items-center mb-4 text-primary font-bold">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-secondary">bed</span>
                  <span>Room Revenue</span>
                </div>
                <span>₹{metrics.roomRevenue.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between items-center mb-4 text-primary font-bold">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-secondary">restaurant</span>
                  <span>Restaurant POS</span>
                </div>
                <span>₹{metrics.posRevenue.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="w-full h-px bg-outline-variant/40 my-6"></div>
              
              <div className="flex justify-between text-2xl font-black text-emerald-700 font-headline items-center">
                <span>Grand Total</span>
                <span>₹{metrics.revenue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button 
              onClick={() => setShowRevenueBreakdown(false)}
              className="w-full py-4 bg-primary hover:bg-primary-container text-white font-bold tracking-widest uppercase rounded-2xl transition-all shadow-xl active:scale-95"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* --- TIER 1: INVOICE PDF OVERLAY --- */}
      {showInvoicePdf && finalInvoiceData && checkoutRoom && (
        <InvoicePDF 
          invoice={{
            invoice_no: finalInvoiceData.invoiceNo,
            room_total: finalInvoiceData.roomSubtotal,
            restaurant_total: finalInvoiceData.foodTotal,
            addon_total: finalInvoiceData.addonTotal,
            grand_total: finalInvoiceData.grandTotal,
            payment_status: 'Paid',
            check_in: previewData?.booking?.check_in || new Date().toISOString(),
            check_out: previewData?.booking?.check_out || new Date().toISOString(),
            room_number: checkoutRoom.room_number,
            room_type: checkoutRoom.type,
            guest_name: previewData?.guest?.name || 'Guest'
          }}
          onClose={() => setShowInvoicePdf(false)}
        />
      )}
    </>
  );
};

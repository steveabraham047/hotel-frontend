import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { QrCode, Printer, ChevronLeft, CalendarDays, MapPin } from 'lucide-react';

export const BoardingPass: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPass = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('guestToken');
        // If guest token, hit /api/user/bookings, if staff hit /api/guests
        let url = `${API_BASE_URL}/api/guests`;
        let headers: any = { 'Authorization': `Bearer ${token}` };
        
        // Let's just hit both and see which one works, or we can check role.
        // Actually, the easiest is to hit the /api/guests, but if it fails (401), hit /api/user/bookings.
        const res = await fetch(`${API_BASE_URL}/api/guests`, { headers });
        if (res.ok) {
          const all = await res.json();
          const b = all.find((x: any) => x.booking_id === Number(id));
          if (b) setData(b);
        } else {
           // Try guest route
           const guestRes = await fetch(`${API_BASE_URL}/api/user/bookings`, { headers });
           const guestAll = await guestRes.json();
           const gb = guestAll.find((x: any) => x.booking_id === Number(id));
           // Map guest booking to the same format
           if (gb) {
             setData({
               guest_name: localStorage.getItem('guestName') || 'Guest',
               email: '',
               check_in: gb.check_in,
               check_out: gb.check_out,
               room_number: gb.room_number,
               room_type: gb.room_type,
               booking_id: gb.booking_id
             });
           }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPass();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-10 font-luxury font-bold text-[#e7c987] text-2xl">Preparing your pass...</div>;
  if (!data) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-10 font-bold text-red-400 text-center text-xl">Booking not found or unauthorized.</div>;

  const dateIn = new Date(data.check_in).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  const dateOut = new Date(data.check_out).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center p-8 print:p-0 print:bg-white font-sans text-white">
      
      {/* ── TOP NAV (Hidden on Print) ── */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-10 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/60 font-bold hover:text-white transition-colors bg-white/5 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-[#d6b16a] text-black px-6 py-2.5 rounded-full font-black tracking-wide hover:bg-[#e7c987] transition-all shadow-[0_0_20px_rgba(214,177,106,0.3)]">
          <Printer className="w-5 h-5" /> Print Pass
        </button>
      </div>

      {/* ── THE TICKET ── */}
      <div className="w-full max-w-3xl rounded-[32px] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.8)] relative border border-white/10 bg-[#121212] print:shadow-none print:border-black/20 print:bg-white">
         
         {/* ── Top Header / Branding ── */}
         <div className="bg-[#1a1a1a] p-10 relative overflow-hidden border-b border-white/5 print:bg-gray-100 print:border-black/10">
            {/* Subtle glow effect */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#d6b16a]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 print:hidden"></div>
            
            <div className="relative z-10 flex justify-between items-center">
               <div>
                  <h1 className="text-4xl font-black font-luxury tracking-tight text-white print:text-black">Paramvah Stays</h1>
                  <p className="text-[#d6b16a] text-xs font-black uppercase tracking-[0.2em] mt-2">Premium Digital Pass</p>
               </div>
               <div className="w-16 h-16 rounded-2xl bg-[#d6b16a]/10 border border-[#d6b16a]/20 flex items-center justify-center print:border-black/20 print:bg-white">
                  <span className="text-3xl text-[#d6b16a] print:text-black">✨</span>
               </div>
            </div>
         </div>

         {/* ── Ticket Body ── */}
         <div className="p-10 relative">
            {/* Cutout circles for realism (The perforation effect) */}
            <div className="absolute top-0 left-[-20px] w-10 h-10 bg-[#0a0a0a] rounded-full -translate-y-1/2 print:hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"></div>
            <div className="absolute top-0 right-[-20px] w-10 h-10 bg-[#0a0a0a] rounded-full -translate-y-1/2 print:hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"></div>
            
            {/* Dashed line */}
            <div className="w-full border-t-[3px] border-dashed border-white/10 absolute top-0 left-0 print:border-black/20"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-6">
               {/* Left Column: Guest & Dates */}
               <div className="col-span-2 space-y-8">
                  {/* Guest Name */}
                  <div>
                     <p className="text-xs font-black uppercase text-white/40 tracking-[0.15em] mb-2 print:text-black/50">Primary Guest</p>
                     <p className="text-3xl font-luxury font-black text-white print:text-black">{data.guest_name}</p>
                     {data.email && <p className="text-sm font-bold text-[#d6b16a] mt-1 print:text-black/70">{data.email}</p>}
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-8">
                     <div className="bg-white/5 p-5 rounded-2xl border border-white/5 print:bg-transparent print:border-black/10 print:p-0">
                        <div className="flex items-center gap-2 mb-2">
                           <CalendarDays className="w-4 h-4 text-[#d6b16a] print:text-black" />
                           <p className="text-xs font-black uppercase text-white/40 tracking-widest print:text-black/50">Check-in</p>
                        </div>
                        <p className="text-xl font-bold text-white print:text-black">{dateIn}</p>
                        <p className="text-sm text-[#d6b16a] font-black mt-1 print:text-black/70">14:00 (2:00 PM)</p>
                     </div>
                     <div className="bg-white/5 p-5 rounded-2xl border border-white/5 print:bg-transparent print:border-black/10 print:p-0">
                        <div className="flex items-center gap-2 mb-2">
                           <CalendarDays className="w-4 h-4 text-[#d6b16a] print:text-black" />
                           <p className="text-xs font-black uppercase text-white/40 tracking-widest print:text-black/50">Check-out</p>
                        </div>
                        <p className="text-xl font-bold text-white print:text-black">{dateOut}</p>
                        <p className="text-sm text-[#d6b16a] font-black mt-1 print:text-black/70">11:00 (11:00 AM)</p>
                     </div>
                  </div>

                  {/* Room Details Highlight */}
                  <div className="flex justify-between items-center bg-gradient-to-br from-[#d6b16a]/20 to-[#e7c987]/5 p-6 rounded-3xl border border-[#d6b16a]/20 print:border-black/20 print:bg-gray-50">
                     <div>
                        <p className="text-xs font-black uppercase text-[#e7c987]/70 tracking-widest mb-1 print:text-black/50">Assigned Room</p>
                        <p className="text-5xl font-black text-white font-luxury print:text-black">{data.room_number}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-black uppercase text-[#e7c987]/70 tracking-widest mb-1 print:text-black/50">Class</p>
                        <p className="text-xl font-black text-[#d6b16a] print:text-black">{data.room_type}</p>
                     </div>
                  </div>
               </div>
               
               {/* Right Column: QR Code */}
               <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l-2 border-dashed border-white/10 pt-8 md:pt-0 md:pl-10 print:border-black/20">
                  <p className="text-xs font-black uppercase text-white/40 tracking-[0.15em] mb-5 print:text-black/50">Scan at Kiosk</p>
                  
                  {/* The actual QR wrapper */}
                  <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] border-4 border-[#d6b16a]/20 print:border-black/20 print:shadow-none">
                     <QrCode className="w-32 h-32 text-black" strokeWidth={1.5} />
                  </div>
                  
                  <div className="mt-6 text-center">
                     <p className="text-[10px] font-black uppercase text-white/30 tracking-widest print:text-black/40">Booking Ref</p>
                     <p className="text-lg font-black text-[#e7c987] tracking-wider print:text-black">PRMV-{data.booking_id.toString().padStart(5, '0')}</p>
                  </div>
               </div>
            </div>
         </div>
         
         {/* ── Footer ── */}
         <div className="bg-gradient-to-r from-[#121212] via-[#1a1a1a] to-[#121212] p-6 text-center border-t border-white/5 flex items-center justify-center gap-2 print:border-black/20 print:bg-white">
            <MapPin className="w-4 h-4 text-[#d6b16a] print:text-black/60" />
            <p className="text-white/40 text-xs font-black tracking-widest uppercase print:text-black/60">Present this pass upon arrival at Paramvah Stays</p>
         </div>
      </div>
    </div>
  );
};

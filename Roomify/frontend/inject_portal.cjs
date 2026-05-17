const fs = require('fs');
const path = 'src/pages/UserPortal.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Add imports after existing lucide imports
const oldImport = `import {
  BedDouble,
  Bookmark,
  CalendarDays,
  Clock,
  CreditCard,
  Download,
  Edit3,
  Gift,
  Heart,
  History,
  IndianRupee,
  Key,
  LogOut,
  Minus,
  Plus,
  QrCode,
  Repeat2,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  UtensilsCrossed,
  UserRound,
  X
} from 'lucide-react';`;

const newImport = `import {
  BedDouble,
  Bookmark,
  CalendarDays,
  Clock,
  CreditCard,
  Download,
  Edit3,
  Gift,
  Heart,
  History,
  IndianRupee,
  Key,
  LogOut,
  MapPin,
  Minus,
  Plus,
  QrCode,
  Repeat2,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  UtensilsCrossed,
  UserRound,
  X
} from 'lucide-react';
import { NearbyAttractionsMap } from '../components/NearbyAttractionsMap';
import { ServiceRequestPanel } from '../components/ServiceRequestPanel';`;

c = c.replace(oldImport, newImport);

// 2. Inject two new sections right before the Available Rooms section
const inject = `
        {/* ──── SERVICE REQUESTS SECTION ──── */}
        {activeBookings.length > 0 && (
          <section className="mb-12">
            <div className="rounded-[28px] border border-[#006B5C]/30 bg-gradient-to-br from-[#006B5C]/15 to-[#00C9A7]/5 p-8">
              <div className="flex items-center gap-4 mb-7">
                <div className="w-14 h-14 rounded-2xl bg-[#006B5C]/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🛎️</span>
                </div>
                <div>
                  <h2 className="font-luxury text-2xl font-black text-white">In-Room Services</h2>
                  <p className="text-white/50 font-bold text-sm mt-0.5">Request housekeeping, maintenance, and more — anytime.</p>
                </div>
              </div>
              <ServiceRequestPanel authHeaders={authHeaders} />
            </div>
          </section>
        )}

        {/* ──── NEARBY ATTRACTIONS MAP SECTION ──── */}
        <section className="mb-12">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8">
            <div className="flex items-center gap-4 mb-7">
              <div className="w-14 h-14 rounded-2xl bg-[#e7c987]/15 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-7 h-7 text-[#e7c987]" />
              </div>
              <div>
                <h2 className="font-luxury text-2xl font-black text-white">Explore Nearby</h2>
                <p className="text-white/50 font-bold text-sm mt-0.5">Restaurants, temples, malls, parks — curated by our concierge team.</p>
              </div>
            </div>
            <NearbyAttractionsMap />
          </div>
        </section>

`;

const marker = `        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-4xl font-luxury font-black text-white">Available Rooms</h2>`;

c = c.replace(marker, inject + marker);

fs.writeFileSync(path, c, 'utf8');
console.log('UserPortal updated successfully!');

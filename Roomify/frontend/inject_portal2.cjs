const fs = require('fs');
const path = 'src/pages/UserPortal.tsx';
let c = fs.readFileSync(path, 'utf8');

if (c.includes('In-Room Services')) {
  console.log('Already injected.');
  process.exit(0);
}

// Use a simpler unique marker that works regardless of line endings
const UNIQUE = 'Available Rooms</h2>';

const idx = c.indexOf(UNIQUE);
if (idx === -1) { console.error('Marker not found!'); process.exit(1); }

// Go back to the start of that <section
let sectionStart = c.lastIndexOf('<section', idx);
if (sectionStart === -1) { console.error('Section not found!'); process.exit(1); }

const INJECTION = `        {/* ── IN-ROOM SERVICE REQUESTS ── */}
        <section className="mb-12">
          <div className="rounded-[28px] border border-[#006B5C]/30 bg-gradient-to-br from-[#006B5C]/15 to-[#00C9A7]/5 p-8">
            <div className="flex items-center gap-4 mb-7">
              <div className="w-14 h-14 rounded-2xl bg-[#006B5C]/30 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🛎️</span>
              </div>
              <div>
                <h2 className="font-luxury text-2xl font-black text-white">In-Room Services</h2>
                {activeBookings.length > 0
                  ? <p className="text-white/50 font-bold text-sm mt-0.5">Request housekeeping, maintenance &amp; more — anytime.</p>
                  : <p className="text-yellow-400/80 font-bold text-sm mt-0.5">⚠️ You need an active check-in to request services.</p>
                }
              </div>
            </div>
            {activeBookings.length > 0
              ? <ServiceRequestPanel authHeaders={authHeaders} />
              : <p className="text-white/30 text-sm font-bold text-center py-6">Book a room and check in to use in-room services.</p>
            }
          </div>
        </section>

        {/* ── NEARBY ATTRACTIONS MAP ── */}
        <section className="mb-12">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8">
            <div className="flex items-center gap-4 mb-7">
              <div className="w-14 h-14 rounded-2xl bg-[#e7c987]/15 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-7 h-7 text-[#e7c987]" />
              </div>
              <div>
                <h2 className="font-luxury text-2xl font-black text-white">Explore Nearby</h2>
                <p className="text-white/50 font-bold text-sm mt-0.5">Restaurants, temples, malls, parks — curated by our concierge.</p>
              </div>
            </div>
            <NearbyAttractionsMap />
          </div>
        </section>

        `;

c = c.slice(0, sectionStart) + INJECTION + c.slice(sectionStart);
fs.writeFileSync(path, c, 'utf8');
console.log('Sections injected at index', sectionStart);

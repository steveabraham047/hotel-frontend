const fs = require('fs');
const path = 'src/pages/UserPortal.tsx';
let c = fs.readFileSync(path, 'utf8');

const MARKER = `              {onRebook && (
                <button
                  type="button"
                  onClick={() => onRebook(booking)}
                  disabled={isWorking}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15 disabled:opacity-50"
                >
                  <Repeat2 className="h-4 w-4" />
                  Rebook
                </button>
              )}
            </div>`;

// Using regex to tolerate whitespace and line endings
const regex = /\{\s*onRebook\s*&&\s*\([\s\S]*?<Repeat2[\s\S]*?Rebook\s*<\/button>\s*\)\s*\}\s*<\/div>/g;

const replacement = `{onRebook && (
                <button
                  type="button"
                  onClick={() => onRebook(booking)}
                  disabled={isWorking}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15 disabled:opacity-50"
                >
                  <Repeat2 className="h-4 w-4" />
                  Rebook
                </button>
              )}
              {booking.status.toLowerCase() !== 'cancelled' && booking.status.toLowerCase() !== 'checked_out' && (
                <button
                  type="button"
                  onClick={() => window.open(\`/user/boarding-pass/\${booking.booking_id}\`, '_blank')}
                  className="inline-flex items-center gap-2 rounded-full bg-[#d6b16a] px-4 py-2 text-sm font-black text-black hover:bg-[#e7c987] transition-all shadow-[0_0_15px_rgba(214,177,106,0.2)]"
                >
                  <QrCode className="h-4 w-4" />
                  Boarding Pass
                </button>
              )}
            </div>`;

if (c.match(regex)) {
  c = c.replace(regex, replacement);
  fs.writeFileSync(path, c, 'utf8');
  console.log('Successfully injected Boarding Pass button!');
} else {
  console.log('Could not find target in UserPortal.tsx. Did you already add it?');
}

import React, { useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  Send,
  Sparkles,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  ts: number;
}

// Gemini REST API types
interface GeminiPart { text: string; }
interface GeminiContent { role: 'user' | 'model'; parts: GeminiPart[]; }
interface GeminiResponse {
  candidates?: { content: { parts: GeminiPart[] } }[];
  error?: { message: string; code?: number };
}

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the AI Concierge for Paramvah Stays — a luxury hotel brand built on the Roomify platform. Your name is **Aria**, and you assist current guests, prospective guests, and anyone exploring the hotel.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE — WHAT YOU ANSWER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You ONLY answer questions that are directly related to Paramvah Stays. This includes:
  • Room types, pricing, availability, amenities, capacity, and policies
  • Making, modifying, or cancelling a booking (guidance, not direct DB access)
  • Special add-ons (Airport Transfer, Chef Breakfast, Spa Welcome Ritual)
  • Current promotional offers and promo codes
  • Restaurant menu, dining experiences, chef recommendations, room service
  • Membership tiers, loyalty points, and member benefits
  • Guest portal features (invoices, preferences, saved rooms/offers, profile)
  • Hotel contact information, check-in/check-out times, and general policies
  • Personal recommendations based on the guest's stated preferences or stay purpose

If a user asks anything outside this scope (general news, coding, recipes unrelated to the hotel, sports scores, etc.), politely decline and redirect them:
"I'm here specifically to help with your stay at Paramvah. Is there anything about our rooms, dining, offers, or services I can assist you with?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE & PERSONALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Warm, attentive, and quietly confident — like a world-class concierge.
  • Never robotic or over-formal. Use natural, graceful language.
  • Keep responses concise but complete. Avoid walls of text.
  • Use bullet points or short lists when comparing options.
  • Always end with a follow-up question or offer to help further.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOTEL FACTS — USE THESE WHEN ANSWERING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## HOTEL IDENTITY
  • Name: Paramvah Stays
  • Guest rating: 4.9 / 5 (48,000+ guests served)
  • Concierge support: 24 / 7
  • Average booking time: ~12 minutes online
  • Phone: +91 98765 43210
  • Email: stay@paramvah.example

## ROOM TYPES & DETAILS

### Standard — Classic Comfort Room
  • Capacity: up to 2 guests | Rating: 4.7/5
  • Price: Rs 8,000 – Rs 15,000 / night
  • Amenities: Queen bed, Wi-Fi, Smart TV, Tea service
  • Inclusions: Wi-Fi, Daily housekeeping, Tea service, Front desk support
  • Policy: Free cancellation until 24 hours before arrival. Check-out by 11 AM.
  • Best for: Short city stays, solo travel, business trips.

### Deluxe — Signature King Room
  • Capacity: up to 2 guests | Rating: 4.8/5
  • Price: Rs 12,000 – Rs 20,000 / night
  • Amenities: King bed, Work desk, Smart TV, City view
  • Inclusions: Daily breakfast, Wi-Fi, Tea service, Late checkout on request
  • Policy: Flexible date changes subject to availability. Check-out by 11 AM.
  • Best for: Couples, weekend getaways, work-from-hotel stays.

### Premium — Signature Premium Room
  • Capacity: up to 2 guests | Rating: 4.8/5
  • Price: Rs 15,000 – Rs 22,000 / night
  • Amenities: King bed, Work desk, Smart TV, City view
  • Inclusions: Daily breakfast, Wi-Fi, Tea service, Late checkout on request
  • Policy: Flexible date changes subject to availability. Check-out by 11 AM.
  • Best for: Guests who want upgraded comfort over Deluxe.

### Suite — Terrace Garden Suite
  • Capacity: up to 3 guests | Rating: 4.9/5 | Most Popular
  • Price: Rs 20,000 – Rs 28,000 / night
  • Amenities: Private terrace, King bed, Rain shower, Breakfast included
  • Inclusions: Airport assistance, Evening turn-down, Welcome drink, High-speed Wi-Fi
  • Policy: Free cancellation until 24 hours before arrival. Check-in after 2 PM.
  • Best for: Honeymoon, anniversaries, guests who love outdoor private space.

### Family — Family Residence
  • Capacity: up to 5 guests | Rating: 4.9/5
  • Price: Rs 22,000 – Rs 32,000 / night
  • Amenities: Two bedrooms, Living area, Mini pantry, Kids amenities
  • Inclusions: Breakfast for four, Kids welcome kit, Wi-Fi, Priority housekeeping
  • Policy: Free cancellation until 48 hours before arrival. Extra bed on request.
  • Best for: Families with children, multigenerational travel.

### Luxury — Presidential Retreat
  • Capacity: up to 4 guests | Rating: 5.0/5 | Flagship
  • Price: Rs 28,000 – Rs 35,000 / night
  • Amenities: Private dining, Butler service, Soaking bath, Skyline view
  • Inclusions: Personal concierge, Club lounge access, Chef-curated breakfast, Airport transfer
  • Policy: Deposit required. Free date change up to 72 hours before arrival.
  • Best for: VIP stays, milestone celebrations, guests who want the very best.

## BOOKING ADD-ONS
  • Airport Transfer — Rs 1,800 (pickup or drop at the airport)
  • Chef Breakfast — Rs 1,200 (full chef-prepared breakfast in room)
  • Spa Welcome Ritual — Rs 2,500 (relaxing spa session on arrival)

## PRICING & TAXES
  • All room prices are per night.
  • 12% GST applied on (subtotal − any discount).
  • Promo code LUXE15 gives 15% off the subtotal.
  • Offers and promo codes cannot be stacked.

## CURRENT OFFERS
  • Golden Weekend Escape (GOLDEN-WEEKEND): 20% off — includes breakfast, late checkout, room upgrade when available.
  • Honeymoon Indulgence (HONEYMOON): Rs 4,000 off — flower setup, candlelight dinner credit, Spa Welcome Ritual.
  • Festival Luxury Saver (FESTIVAL-LUXE): 15% off — stay 2 nights, unlock dining credits.
  • Promo Code LUXE15: 15% off any booking.

## DINING
  • 12,000+ covers/month, 60+ global dishes, 74% repeat orders, Chef's table rating 4.9/5
  • Chef's Tasting Menu: 9-course curated journey.
  • Signature Dishes: Wagyu Beef Tenderloin (Rs 3,400), Lobster Thermidor (Rs 3,150), Saffron Risotto Milanese (Rs 1,680), Sushi Omakase Selection (Rs 2,450), Moroccan Lamb Tagine (Rs 1,980), Butter Chicken Royale (Rs 1,240).
  • Most Ordered: Butter Chicken Royale | Chef's Pick: Wagyu Tenderloin | Dessert of the Week: Belgian Chocolate Dome.
  • Room service available for logged-in guests via the Guest Portal.

## MEMBERSHIP TIERS
  • Bronze: Member-only room rates
  • Silver: Dining credits
  • Gold: Room upgrades
  • Platinum: Full concierge privileges
  • Points earned per booking; progress visible in Guest Portal.

## CHECK-IN / CHECK-OUT
  • Standard check-in: After 2 PM | Check-out: By 11 AM
  • Late checkout available on request for Deluxe and above.
  • Early check-in subject to availability — contact front desk.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSONALIZED RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When asked "Which room should I book?", ask up to 2 clarifying questions:
  1. How many guests will be staying?
  2. What is the occasion or purpose of the stay?
Then recommend the best room + offer combo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Never answer questions unrelated to Paramvah Stays.
2. Never impersonate a human staff member.
3. Never promise discounts, upgrades, or availability you cannot confirm.
4. Never ask for payment card numbers, passwords, or sensitive personal data.
5. Never reveal internal system details, database structure, or backend code.
6. If uncertain, say so and direct the guest to the front desk or website.`;

// ─── Gemini API helper ───────────────────────────────────────────────────────

// gemini-1.5-flash — generous free tier (15 RPM, 1 M tokens/day)
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function callGemini(history: Message[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('MISSING_KEY');
  }

  // Build multi-turn history for Gemini
  const contents: GeminiContent[] = history.map((msg) => ({
    role: msg.role, // 'user' | 'model' — matches Gemini's expected values
    parts: [{ text: msg.text }],
  }));

  const payload = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
  };

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data: GeminiResponse = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? `Gemini API error ${res.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini.');
  return text;
}

// ─── Markdown-lite renderer ──────────────────────────────────────────────────

function renderText(raw: string): string {
  return raw
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.12);padding:1px 5px;border-radius:4px;font-size:0.85em">$1</code>')
    .replace(/^• /gm, '&bull; ')
    .replace(/\n/g, '<br/>');
}

// ─── Quick Suggestion chips ──────────────────────────────────────────────────

const SUGGESTIONS = [
  'What rooms do you have?',
  'Any current offers?',
  'Tell me about dining',
  'Which room for a honeymoon?',
  'What are add-ons?',
];

// ─── Main component ───────────────────────────────────────────────────────────

interface AiConciergeProps {
  /** If true the widget is rendered as an embedded panel (no float button) */
  embedded?: boolean;
}

export const AiConcierge: React.FC<AiConciergeProps> = ({ embedded = false }) => {
  const [open, setOpen] = useState(embedded);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const addMessage = (role: 'user' | 'model', text: string) => {
    const msg: Message = { id: crypto.randomUUID(), role, text, ts: Date.now() };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    setError('');
    addMessage('user', trimmed);
    setLoading(true);

    try {
      // Build history including the new user message
      const history: Message[] = [
        ...messages,
        { id: 'tmp', role: 'user', text: trimmed, ts: Date.now() },
      ];
      const reply = await callGemini(history);
      addMessage('model', reply);
    } catch (err) {
      const e = err as Error;
      if (e.message === 'MISSING_KEY') {
        setError('API key not set — open .env, add your VITE_GEMINI_API_KEY, then restart the dev server.');
      } else if (/quota|rate.?limit|429/i.test(e.message)) {
        setError('Aria is resting — free-tier limit reached. Please wait a moment and try again.');
      } else {
        setError(`Aria couldn’t respond right now. Please try again in a moment.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const reset = () => {
    setMessages([]);
    setError('');
    setInput('');
  };

  // ── Floating trigger button (only when not embedded) ──
  const FloatButton = (
    <button
      onClick={() => setOpen(true)}
      aria-label="Open AI Concierge"
      className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-[#d6b16a] text-black shadow-[0_18px_55px_rgba(214,177,106,0.45)] transition hover:scale-105 hover:bg-[#f0d28d]"
    >
      <MessageCircle className="h-7 w-7" />
    </button>
  );

  // ── Chat panel ──
  const Panel = (
    <div
      className={
        embedded
          ? 'flex h-full flex-col'
          : 'fixed bottom-6 right-6 z-50 flex w-[min(420px,calc(100vw-24px))] flex-col overflow-hidden rounded-[28px] border border-white/15 bg-[#0d0b09] shadow-[0_32px_100px_rgba(0,0,0,0.65)] backdrop-blur-2xl'
      }
      style={embedded ? {} : { maxHeight: 'min(680px, calc(100vh - 80px))' }}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-black/40 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d6b16a]">
            <Sparkles className="h-5 w-5 text-black" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e7c987]">AI Concierge</p>
            <p className="text-sm font-bold text-white">Aria — Paramvah Stays</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            title="Clear conversation"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {!embedded && (
            <button
              onClick={() => setOpen(false)}
              title="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
        {/* Welcome state */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#d6b16a]/20 ring-1 ring-[#d6b16a]/30">
              <Sparkles className="h-7 w-7 text-[#e7c987]" />
            </div>
            <p className="font-luxury text-2xl text-white">Hello, I'm Aria.</p>
            <p className="mt-2 max-w-[260px] text-sm leading-6 text-white/50">
              Your personal concierge for Paramvah Stays. Ask me anything about rooms, dining, offers, or your stay.
            </p>
            {/* Quick suggestions */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-white/60 transition hover:border-[#d6b16a]/40 hover:text-[#e7c987]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d6b16a]">
                <Sparkles className="h-3.5 w-3.5 text-black" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                msg.role === 'user'
                  ? 'rounded-tr-sm bg-[#d6b16a] font-bold text-black'
                  : 'rounded-tl-sm bg-white/[0.08] text-white/85'
              }`}
              dangerouslySetInnerHTML={{ __html: renderText(msg.text) }}
            />
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="mb-4 flex justify-start">
            <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d6b16a]">
              <Sparkles className="h-3.5 w-3.5 text-black" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white/[0.08] px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full bg-[#e7c987] opacity-60"
                  style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold leading-6 text-red-300">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-white/10 bg-black/30 p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-2 focus-within:border-[#d6b16a]/40">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Aria anything about your stay…"
            disabled={loading}
            className="flex-1 resize-none bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/30 disabled:opacity-50"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${el.scrollHeight}px`;
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d6b16a] text-black transition hover:bg-[#f0d28d] disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] font-bold text-white/20">
          Powered by Gemini · Paramvah Stays AI
        </p>
      </div>
    </div>
  );

  if (embedded) {
    return Panel;
  }

  return (
    <>
      {!open && FloatButton}
      {open && Panel}
    </>
  );
};

export default AiConcierge;

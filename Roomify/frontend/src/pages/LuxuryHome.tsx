import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AiConcierge } from '../components/AiConcierge';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gem,
  Mail,
  Menu,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X
} from 'lucide-react';
import { experiences, offers as fallbackOffers, testimonials, type LuxuryRoom } from '../data/luxuryHotel';
import { API_BASE_URL } from '../config/api';
import { readApiResponse } from '../utils/apiResponse';

interface BookingDraft {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  roomType: string;
  promo: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  addons: string[];
  offer: string;
}

interface ApiRoom {
  room_id: number;
  type: string;
  status: string;
}

interface OfferView {
  offer_code: string;
  title: string;
  tag: string;
  discount: string;
  ends: string;
  copy: string;
}

interface ApiOffer {
  offer_code: string;
  title: string;
  tag: string;
  discount_label: string;
  description: string;
  ends_at: string | null;
}

interface DiningDish {
  menu_item_id: number;
  name: string;
  category: string;
  price: number;
  image_url?: string | null;
  description?: string | null;
  is_bestseller?: number;
  is_chef_pick?: number;
  is_dessert_week?: number;
}

interface DiningShowcase {
  most_ordered_title: string;
  most_ordered_subtitle: string;
  chef_recommendation_title: string;
  chef_recommendation_subtitle: string;
  dessert_week_title: string;
  dessert_week_subtitle: string;
}

const todayInput = () => new Date().toISOString().slice(0, 10);

const futureInput = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const defaultDraft: BookingDraft = {
  checkIn: todayInput(),
  checkOut: futureInput(1),
  adults: 2,
  children: 0,
  roomType: 'Any',
  promo: '',
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  addons: [],
  offer: ''
};

const getInitialDraft = () => {
  try {
    const savedDraft = localStorage.getItem('luxuryBookingDraft');
    if (!savedDraft) return defaultDraft;

    const parsed = JSON.parse(savedDraft) as Partial<BookingDraft>;
    const normalizeDate = (value: unknown, fallback: string) => {
      if (typeof value !== 'string' || !value.trim()) return fallback;
      const raw = value.trim();
      // Accept YYYY-MM-DD or full ISO strings and coerce to date input format.
      const iso = raw.length >= 10 ? raw.slice(0, 10) : raw;
      return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : fallback;
    };

    return {
      ...defaultDraft,
      ...parsed,
      checkIn: normalizeDate(parsed.checkIn, defaultDraft.checkIn),
      checkOut: normalizeDate(parsed.checkOut, defaultDraft.checkOut)
    };
  } catch {
    return defaultDraft;
  }
};

const addonOptions = [
  { id: 'airport', title: 'Airport Transfer', price: 1800 },
  { id: 'breakfast', title: 'Chef Breakfast', price: 1200 },
  { id: 'spa', title: 'Spa Welcome Ritual', price: 2500 }
];

const roomTypes = ['Any', 'Standard', 'Deluxe', 'Suite', 'Premium', 'Family', 'Luxury'];

const fallbackOfferViews: OfferView[] = fallbackOffers.map((offer) => ({
  offer_code: offer.title.toLowerCase().replace(/\s+/g, '-'),
  title: offer.title,
  tag: offer.tag,
  discount: offer.discount,
  ends: offer.ends,
  copy: offer.copy
}));

const normalizeOffer = (offer: ApiOffer): OfferView => ({
  offer_code: offer.offer_code,
  title: offer.title,
  tag: offer.tag,
  discount: offer.discount_label,
  ends: offer.ends_at ? `Ends ${new Date(offer.ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Limited slots',
  copy: offer.description
});

const formatCurrency = (value: number) =>
  value.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const nightsBetween = (checkIn: string, checkOut: string) => {
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 1;
  return Math.max(1, Math.ceil((end - start) / 86400000));
};

export const LuxuryHome: React.FC = () => {
  const navigate = useNavigate();
  const roomsSectionRef = useRef<HTMLElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draft, setDraft] = useState<BookingDraft>(getInitialDraft);
  const [roomFilter, setRoomFilter] = useState({ type: 'Any', capacity: 1, maxPrice: 35000 });
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [publicRooms, setPublicRooms] = useState<LuxuryRoom[]>([]);
  const [publicOffers, setPublicOffers] = useState<OfferView[]>(fallbackOfferViews);
  const [diningDishes, setDiningDishes] = useState<DiningDish[]>([]);
  const [diningShowcase, setDiningShowcase] = useState<DiningShowcase>(fallbackDiningShowcase);
  const [selectedRoom, setSelectedRoom] = useState<LuxuryRoom | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [bookingRoom, setBookingRoom] = useState<LuxuryRoom | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingNotice, setBookingNotice] = useState('');
  // AI Concierge state removed — now handled inside <AiConcierge />

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    localStorage.setItem('luxuryBookingDraft', JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    let isMounted = true;

    const fetchPublicRooms = async () => {
      setLoadingRooms(true);
      try {
        const params = new URLSearchParams({
          check_in: draft.checkIn,
          check_out: draft.checkOut,
          capacity: String(roomFilter.capacity),
          max_price: String(roomFilter.maxPrice)
        });

        if (roomFilter.type !== 'Any') {
          params.set('type', roomFilter.type);
        }

        const response = await fetch(`${API_BASE_URL}/api/public/rooms?${params.toString()}`);
        const data = await readApiResponse<LuxuryRoom[] | { error?: string }>(response);

        if (!response.ok || !Array.isArray(data)) {
          throw new Error(('error' in data && data.error) || 'Could not load public rooms.');
        }

        if (isMounted) setPublicRooms(data);
      } catch {
        if (isMounted) setPublicRooms([]);
      } finally {
        if (isMounted) setLoadingRooms(false);
      }
    };

    fetchPublicRooms();
    return () => {
      isMounted = false;
    };
  }, [draft.checkIn, draft.checkOut, roomFilter]);

  const roomTypeOptions = useMemo(() => {
    const types = new Set(publicRooms.map((room) => room.type).filter(Boolean));
    return ['Any', ...Array.from(types).sort((a, b) => a.localeCompare(b))];
  }, [publicRooms]);

  useEffect(() => {
    let isMounted = true;

    const fetchOffers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/public/offers`);
        const data = await readApiResponse<ApiOffer[] | { error?: string }>(response);
        if (!response.ok || !Array.isArray(data)) throw new Error('Could not load offers.');
        if (isMounted) setPublicOffers(data.map(normalizeOffer));
      } catch {
        if (isMounted) setPublicOffers(fallbackOfferViews);
      }
    };

    fetchOffers();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchDining = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/public/dining`);
        const data = await readApiResponse<{ showcase?: DiningShowcase; dishes?: DiningDish[]; error?: string }>(response);
        if (!response.ok) throw new Error(data.error || 'Could not load dining data.');
        if (!isMounted) return;
        setDiningShowcase(data.showcase || fallbackDiningShowcase);
        setDiningDishes(Array.isArray(data.dishes) ? data.dishes : []);
      } catch {
        if (!isMounted) return;
        setDiningShowcase(fallbackDiningShowcase);
        setDiningDishes([]);
      }
    };

    fetchDining();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRooms = useMemo(
    () =>
      publicRooms.filter((room) => {
        const typeMatch = roomFilter.type === 'Any' || room.type === roomFilter.type;
        return typeMatch && room.capacity >= roomFilter.capacity && room.price <= roomFilter.maxPrice;
      }),
    [publicRooms, roomFilter]
  );

  const suggestedRoom = useMemo(() => {
    if (draft.roomType !== 'Any') {
      return publicRooms.find((room) => room.type === draft.roomType) ?? publicRooms[0] ?? null;
    }
    return publicRooms[0] ?? null;
  }, [draft.roomType, publicRooms]);

  const activeRoom = bookingRoom ?? selectedRoom ?? suggestedRoom;
  const safeActiveRoom = activeRoom ?? {
    id: 'room-fallback',
    room_id: 0,
    room_number: '',
    title: 'Select a room',
    type: 'Any',
    price: 0,
    price_per_night: 0,
    capacity: 1,
    rating: 0,
    popular: false,
    image: '',
    gallery: [],
    description: '',
    amenities: [],
    included: [],
    policy: '',
    status: 'Unavailable',
    available: false
  };
  const nights = nightsBetween(draft.checkIn, draft.checkOut);
  const addonTotal = addonOptions
    .filter((addon) => draft.addons.includes(addon.id))
    .reduce((sum, addon) => sum + addon.price, 0);
  const subtotal = safeActiveRoom.price * nights + addonTotal;
  const discount = draft.promo.trim().toUpperCase() === 'LUXE15' || draft.offer ? Math.round(subtotal * 0.15) : 0;
  const taxes = Math.round((subtotal - discount) * 0.12);
  const grandTotal = subtotal - discount + taxes;

  const updateDraft = (patch: Partial<BookingDraft>) => setDraft((current) => ({ ...current, ...patch }));

  const requireGuestAuth = (bookingIntent?: Record<string, unknown>) => {
    const token = localStorage.getItem('guestToken');
    if (token) return true;
    if (bookingIntent) {
      localStorage.setItem('pendingPublicBooking', JSON.stringify(bookingIntent));
    }
    navigate('/user/login', { replace: false });
    return false;
  };

  const openBooking = (room: LuxuryRoom) => {
    const intent = {
      room_id: room.room_id,
      roomType: room.type,
      check_in: draft.checkIn,
      check_out: draft.checkOut,
      addons: draft.addons,
      offer: draft.offer,
      promo: draft.promo
    };

    if (!requireGuestAuth(intent)) return;
    setBookingRoom(room);
    setBookingStep(1);
  };

  const submitAvailability = (event: React.FormEvent) => {
    event.preventDefault();
    window.setTimeout(() => {
      roomsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const confirmBooking = async () => {
    setBookingStep(6);
    setBookingNotice('');

    const token = localStorage.getItem('guestToken');
    const room = bookingRoom ?? suggestedRoom;
    if (!room) {
      setBookingNotice('No rooms are available for these filters.');
      return;
    }
    const bookingIntent = {
      roomType: room.type,
      check_in: draft.checkIn,
      check_out: draft.checkOut,
      addons: draft.addons,
      offer: draft.offer,
      promo: draft.promo
    };

    localStorage.setItem('pendingPublicBooking', JSON.stringify(bookingIntent));

    if (!token) {
      setBookingNotice('Login as a guest to complete this booking with live room inventory.');
      window.setTimeout(() => navigate('/user/login'), 500);
      return;
    }

    try {
      const dateParams = new URLSearchParams({
        check_in: draft.checkIn,
        check_out: draft.checkOut
      });
      const roomsWithDatesResponse = await fetch(`${API_BASE_URL}/api/user/rooms/available?${dateParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const roomsData = await readApiResponse<ApiRoom[] | { error?: string }>(roomsWithDatesResponse);

      if (!roomsWithDatesResponse.ok || !Array.isArray(roomsData)) {
        throw new Error(('error' in roomsData && roomsData.error) || 'Could not load live rooms.');
      }

      const availableRoom = room.room_id
        ? roomsData.find((apiRoom) => apiRoom.room_id === room.room_id)
        : roomsData.find((apiRoom) => apiRoom.type === room.type) ?? roomsData[0];
      if (!availableRoom) {
        throw new Error('No live rooms are available for this booking right now.');
      }

      const bookingResponse = await fetch(`${API_BASE_URL}/api/user/bookings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_id: availableRoom.room_id,
          check_in: draft.checkIn,
          check_out: draft.checkOut
        })
      });
      const bookingData = await readApiResponse<{ error?: string; message?: string }>(bookingResponse);

      if (!bookingResponse.ok) {
        throw new Error(bookingData.error || 'Could not complete live booking.');
      }

      localStorage.removeItem('pendingPublicBooking');
      setBookingNotice(bookingData.message || 'Booking completed. Opening your guest dashboard.');
      window.setTimeout(() => navigate('/user'), 1300);
    } catch (error) {
      setBookingNotice(error instanceof Error ? error.message : 'Could not complete live booking.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070605] text-[#f8f1e7] selection:bg-[#d6b16a] selection:text-black">
      <LuxuryNav scrolled={scrolled} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main>
        <section id="home" className="relative min-h-screen overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2400&auto=format&fit=crop"
            alt="Luxury hotel lobby"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-black/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070605] via-transparent to-black/40" />

          <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-end px-5 pb-10 pt-32 lg:px-8 lg:pb-16">
            <div className="grid items-end gap-10 lg:grid-cols-[1fr_440px]">
              <div className="max-w-3xl animate-luxury-fade">
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-[#e7c987] backdrop-blur-2xl">
                  <Sparkles className="h-4 w-4" />
                  Premium stays in motion
                </p>
                <h1 className="font-luxury text-6xl leading-[0.95] text-white md:text-7xl lg:text-8xl">
                  A quieter kind of luxury.
                </h1>
                <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72">
                  Cinematic rooms, thoughtful hospitality, curated dining, and a smoother way to reserve your stay.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group inline-flex items-center gap-3 rounded-full bg-[#d6b16a] px-7 py-4 font-bold text-black shadow-[0_18px_55px_rgba(214,177,106,0.28)] transition hover:scale-[1.02] hover:bg-[#f0d28d]"
                  >
                    Explore Rooms
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </button>
                  <Link
                    to="/user/login"
                    className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-7 py-4 font-bold text-white backdrop-blur-xl transition hover:bg-white/18"
                  >
                    Guest Login
                  </Link>
                </div>
              </div>

              <HeroBookingWidget
                draft={draft}
                updateDraft={updateDraft}
                submitAvailability={submitAvailability}
                previewTotal={grandTotal}
              />
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0d0b09] py-6">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 text-center md:grid-cols-4 lg:px-8">
            {[
              ['48k+', 'Guests served'],
              ['4.9/5', 'Guest rating'],
              ['12 min', 'Avg booking time'],
              ['24/7', 'Concierge support']
            ].map(([value, label]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-luxury text-4xl text-[#e7c987]">{value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-white/45">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="rooms"
          ref={(node) => {
            roomsSectionRef.current = node;
          }}
          className="mx-auto max-w-7xl px-5 py-24 lg:px-8"
        >
          <SectionHeading
            eyebrow="Room Discovery"
            title="Choose your pace of luxury."
            copy="Filter by price, capacity, and stay style. Every room card is designed for fast comparison and confident booking."
          />

          <div className="mb-8 grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-2xl md:grid-cols-4">
            <select
              value={roomFilter.type}
              onChange={(event) => setRoomFilter((current) => ({ ...current, type: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none"
              aria-label="Room type filter"
            >
              {roomTypeOptions.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <Stepper
              label="Capacity"
              value={roomFilter.capacity}
              min={1}
              max={5}
              onChange={(value) => setRoomFilter((current) => ({ ...current, capacity: value }))}
            />
            <label className="md:col-span-2">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                Max price Rs {formatCurrency(roomFilter.maxPrice)}
              </span>
              <input
                type="range"
                min={8000}
                max={35000}
                step={1000}
                value={roomFilter.maxPrice}
                onChange={(event) =>
                  setRoomFilter((current) => ({ ...current, maxPrice: Number(event.target.value) }))
                }
                className="w-full accent-[#d6b16a]"
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {loadingRooms
              ? Array.from({ length: 4 }).map((_, index) => <RoomSkeleton key={index} />)
              : filteredRooms.length > 0
                ? filteredRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onDetails={() => {
                        setSelectedRoom(room);
                        setGalleryIndex(0);
                      }}
                      onBook={() => openBooking(room)}
                    />
                  ))
                : (
                    <div className="md:col-span-2 xl:col-span-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-10 text-center">
                      <p className="font-black text-white text-lg">No rooms match your filters right now.</p>
                      <p className="mt-2 text-sm font-bold text-white/45">Try changing dates, type, capacity, or max price.</p>
                    </div>
                  )}
          </div>
        </section>

        <section id="offers" className="bg-[#11100e] px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Special Offers"
              title="Limited-time privileges."
              copy="Festival discounts, weekend escapes, membership perks, and curated packages presented with clear value."
            />
            <div className="grid gap-6 md:grid-cols-3">
              {publicOffers.map((offer) => (
                <article
                  key={offer.title}
                  className="group rounded-[28px] border border-[#d6b16a]/20 bg-gradient-to-br from-[#d6b16a]/18 to-white/[0.04] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 hover:border-[#d6b16a]/45"
                >
                  <p className="mb-5 inline-flex rounded-full bg-[#d6b16a] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-black">
                    {offer.tag}
                  </p>
                  <h3 className="font-luxury text-4xl text-white">{offer.title}</h3>
                  <p className="mt-4 text-3xl font-black text-[#e7c987]">{offer.discount}</p>
                  <p className="mt-3 text-sm font-bold text-white/45">{offer.ends}</p>
                  <p className="mt-5 leading-7 text-white/65">{offer.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <DiningSection showcase={diningShowcase} dishes={diningDishes} />
        <ExperiencesSection />
        <MembershipSection />
        <ReviewsSection />
        <ContactSection />
      </main>

      {/* ── AI Concierge floating widget ── */}
      <AiConcierge />

      {selectedRoom && (
        <RoomDetailsModal
          room={selectedRoom}
          galleryIndex={galleryIndex}
          setGalleryIndex={setGalleryIndex}
          onClose={() => setSelectedRoom(null)}
          onBook={() => openBooking(selectedRoom)}
          nights={nights}
        />
      )}

      {bookingRoom && (
        <BookingFlowModal
          room={bookingRoom}
          step={bookingStep}
          setStep={setBookingStep}
          draft={draft}
          updateDraft={updateDraft}
          subtotal={subtotal}
          discount={discount}
          taxes={taxes}
          grandTotal={grandTotal}
          nights={nights}
          onClose={() => setBookingRoom(null)}
          onConfirm={confirmBooking}
          bookingNotice={bookingNotice}
          bookingOffers={publicOffers}
        />
      )}
    </div>
  );
};

const LuxuryNav: React.FC<{
  scrolled: boolean;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}> = ({ scrolled, mobileOpen, setMobileOpen }) => {
  const links = ['Home', 'Rooms', 'Dining', 'Offers', 'Experiences', 'Membership', 'Reviews', 'Contact'];

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'border-b border-white/10 bg-black/82 shadow-2xl backdrop-blur-2xl' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" className="font-luxury text-3xl text-white">
          Paramvah
        </Link>
        <div className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-sm font-bold text-white/62 transition hover:text-[#e7c987]"
            >
              {link}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/login" className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white/70">
            Staff
          </Link>
          <Link to="/user/login" className="rounded-full bg-[#d6b16a] px-5 py-3 text-sm font-black text-black">
            Guest Portal
          </Link>
        </div>
        <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open navigation menu">
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </nav>
      {mobileOpen && (
        <div className="border-t border-white/10 bg-black/95 px-5 py-5 lg:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-2xl bg-white/[0.04] px-4 py-3 font-bold text-white/75"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

const HeroBookingWidget: React.FC<{
  draft: BookingDraft;
  updateDraft: (patch: Partial<BookingDraft>) => void;
  submitAvailability: (event: React.FormEvent) => void;
  previewTotal: number;
}> = ({ draft, updateDraft, submitAvailability, previewTotal }) => (
  <form
    onSubmit={submitAvailability}
    className="rounded-[32px] border border-white/18 bg-black/35 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-3xl"
  >
    <div className="mb-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e7c987]">Instant Booking</p>
        <h2 className="mt-1 font-luxury text-3xl text-white">Check availability</h2>
      </div>
      <Search className="h-6 w-6 text-[#e7c987]" />
    </div>
    <div className="grid gap-3">
      <DateField label="Check-in" value={draft.checkIn} onChange={(value) => updateDraft({ checkIn: value })} />
      <DateField label="Check-out" value={draft.checkOut} onChange={(value) => updateDraft({ checkOut: value })} />
      <div className="grid grid-cols-2 gap-3">
        <Stepper label="Adults" value={draft.adults} min={1} max={6} onChange={(adults) => updateDraft({ adults })} />
        <Stepper label="Children" value={draft.children} min={0} max={4} onChange={(children) => updateDraft({ children })} />
      </div>
      <select
        value={draft.roomType}
        onChange={(event) => updateDraft({ roomType: event.target.value })}
        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm font-bold text-white outline-none"
        aria-label="Room type"
      >
        {roomTypes.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      <input
        value={draft.promo}
        onChange={(event) => updateDraft({ promo: event.target.value })}
        placeholder="Promo code: try LUXE15"
        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm font-bold text-white outline-none placeholder:text-white/35"
      />
    </div>
    <div className="mt-5 rounded-3xl border border-[#d6b16a]/25 bg-[#d6b16a]/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white/55">Preview total</span>
        <span className="text-2xl font-black text-[#e7c987]">Rs {formatCurrency(previewTotal)}</span>
      </div>
      <p className="mt-2 text-xs font-bold text-white/42">Taxes and smart offer estimate included.</p>
    </div>
    <button className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#d6b16a] py-4 font-black text-black transition hover:bg-[#f0d28d]">
      Check Availability
      <ArrowRight className="h-4 w-4" />
    </button>
  </form>
);

const DateField: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({
  label,
  value,
  onChange
}) => (
  <label>
    <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-white/45">{label}</span>
    <input
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm font-bold text-white outline-none"
      required
    />
  </label>
);

const Stepper: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, onChange }) => (
  <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-white/45">{label}</span>
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
        aria-label={`Decrease ${label}`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="font-black text-white">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
        aria-label={`Increase ${label}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const SectionHeading: React.FC<{ eyebrow: string; title: string; copy: string }> = ({ eyebrow, title, copy }) => (
  <div className="mb-10 max-w-3xl">
    <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-[#e7c987]">{eyebrow}</p>
    <h2 className="font-luxury text-5xl leading-tight text-white md:text-6xl">{title}</h2>
    <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">{copy}</p>
  </div>
);

const RoomSkeleton: React.FC = () => <div className="h-[430px] animate-pulse rounded-[28px] bg-white/[0.07]" />;

const RoomCard: React.FC<{ room: LuxuryRoom; onDetails: () => void; onBook: () => void }> = ({
  room,
  onDetails,
  onBook
}) => (
  <article className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] shadow-[0_24px_70px_rgba(0,0,0,0.25)] transition duration-500 hover:-translate-y-2 hover:bg-white/[0.09]">
    <button onClick={onDetails} className="relative block h-64 w-full overflow-hidden text-left">
      <img
        src={room.image}
        alt={room.title}
        loading="lazy"
        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      {room.popular && (
        <span className="absolute left-4 top-4 rounded-full bg-[#d6b16a] px-3 py-1 text-xs font-black uppercase text-black">
          Most Popular
        </span>
      )}
      <div className="absolute bottom-4 left-4 right-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e7c987]">{room.type}</p>
        <h3 className="mt-1 font-luxury text-3xl text-white">{room.title}</h3>
      </div>
    </button>
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-2xl font-black text-white">Rs {formatCurrency(room.price)}</span>
        <span className="flex items-center gap-1 text-sm font-bold text-[#e7c987]">
          <Star className="h-4 w-4 fill-[#e7c987]" />
          {room.rating}
        </span>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {room.amenities.slice(0, 3).map((amenity) => (
          <span key={amenity} className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-bold text-white/55">
            {amenity}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onDetails}
          className="rounded-2xl border border-white/12 px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10"
        >
          Details
        </button>
        <button
          onClick={onBook}
          className="rounded-2xl bg-[#d6b16a] px-4 py-3 text-sm font-black text-black transition hover:bg-[#f0d28d]"
        >
          Book Now
        </button>
      </div>
    </div>
  </article>
);

const RoomDetailsModal: React.FC<{
  room: LuxuryRoom;
  galleryIndex: number;
  setGalleryIndex: (value: number) => void;
  onClose: () => void;
  onBook: () => void;
  nights: number;
}> = ({ room, galleryIndex, setGalleryIndex, onClose, onBook, nights }) => (
  <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/75 p-4 backdrop-blur-xl">
    <div className="mx-auto my-6 max-w-6xl overflow-hidden rounded-[32px] border border-white/12 bg-[#11100e] shadow-2xl">
      <div className="relative h-[420px]">
        <img src={room.gallery[galleryIndex]} alt={room.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <button onClick={onClose} className="absolute right-5 top-5 rounded-full bg-black/55 p-3" aria-label="Close">
          <X />
        </button>
        <button
          onClick={() => setGalleryIndex((galleryIndex + room.gallery.length - 1) % room.gallery.length)}
          className="absolute left-5 top-1/2 rounded-full bg-black/55 p-3"
          aria-label="Previous image"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => setGalleryIndex((galleryIndex + 1) % room.gallery.length)}
          className="absolute right-5 top-1/2 rounded-full bg-black/55 p-3"
          aria-label="Next image"
        >
          <ChevronRight />
        </button>
        <div className="absolute bottom-8 left-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e7c987]">{room.type}</p>
          <h2 className="font-luxury text-6xl text-white">{room.title}</h2>
        </div>
      </div>
      <div className="grid gap-8 p-6 lg:grid-cols-[1fr_360px] lg:p-8">
        <div>
          <p className="text-lg leading-8 text-white/68">{room.description}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {room.included.map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <BadgeCheck className="mb-3 h-5 w-5 text-[#e7c987]" />
                <p className="font-bold text-white">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-6">
            <h3 className="mb-3 font-luxury text-3xl text-white">Rules and policies</h3>
            <p className="leading-7 text-white/58">{room.policy}</p>
          </div>
        </div>
        <aside className="sticky top-24 h-fit rounded-[28px] border border-[#d6b16a]/25 bg-[#d6b16a]/10 p-6">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-[#e7c987]">
            <Clock className="h-4 w-4" />
            Limited availability today
          </p>
          <div className="mb-5 flex items-end justify-between">
            <span className="text-white/55">Nightly price</span>
            <span className="text-3xl font-black text-white">Rs {formatCurrency(room.price)}</span>
          </div>
          <div className="mb-6 rounded-2xl bg-black/30 p-4 text-sm text-white/62">
            Estimated {nights} night total: <span className="font-black text-[#e7c987]">Rs {formatCurrency(room.price * nights)}</span>
          </div>
          <button onClick={onBook} className="w-full rounded-2xl bg-[#d6b16a] py-4 font-black text-black">
            Reserve Now
          </button>
        </aside>
      </div>
    </div>
  </div>
);

const BookingFlowModal: React.FC<{
  room: LuxuryRoom;
  step: number;
  setStep: (step: number) => void;
  draft: BookingDraft;
  updateDraft: (patch: Partial<BookingDraft>) => void;
  subtotal: number;
  discount: number;
  taxes: number;
  grandTotal: number;
  nights: number;
  onClose: () => void;
  onConfirm: () => void;
  bookingNotice: string;
  bookingOffers: OfferView[];
}> = ({ room, step, setStep, draft, updateDraft, subtotal, discount, taxes, grandTotal, nights, onClose, onConfirm, bookingNotice, bookingOffers }) => {
  const steps = ['Room', 'Guest', 'Add-ons', 'Offers', 'Payment', 'Confirm'];
  const canContinue =
    step !== 2 || (draft.guestName.trim() && draft.guestEmail.trim() && draft.guestPhone.trim());

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-xl">
      <div className="w-full max-w-4xl rounded-[32px] border border-white/12 bg-[#11100e] p-5 shadow-2xl md:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e7c987]">Booking Flow</p>
            <h2 className="mt-2 font-luxury text-4xl text-white">{room.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close booking flow">
            <X className="text-white/60" />
          </button>
        </div>

        <div className="mb-8 grid grid-cols-6 gap-2">
          {steps.map((label, index) => (
            <div key={label} className="min-w-0">
              <div className={`h-1.5 rounded-full ${step >= index + 1 ? 'bg-[#d6b16a]' : 'bg-white/12'}`} />
              <p className="mt-2 truncate text-xs font-bold text-white/45">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-h-[300px]">
            {step === 1 && (
              <div>
                <h3 className="font-luxury text-3xl text-white">Selected room</h3>
                <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05]">
                  <img src={room.image} alt={room.title} className="h-56 w-full object-cover" />
                  <div className="p-5">
                    <p className="text-[#e7c987]">{room.type}</p>
                    <p className="mt-1 text-2xl font-black text-white">Rs {formatCurrency(room.price)} / night</p>
                  </div>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-luxury text-3xl text-white">Guest details</h3>
                {[
                  ['guestName', 'Full name', 'text'],
                  ['guestEmail', 'Email address', 'email'],
                  ['guestPhone', 'Phone number', 'tel']
                ].map(([key, label, type]) => (
                  <input
                    key={key}
                    type={type}
                    value={draft[key as keyof BookingDraft] as string}
                    onChange={(event) => updateDraft({ [key]: event.target.value } as Partial<BookingDraft>)}
                    placeholder={label}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 font-bold text-white outline-none placeholder:text-white/35"
                    required
                  />
                ))}
              </div>
            )}
            {step === 3 && (
              <div>
                <h3 className="font-luxury text-3xl text-white">Add-ons</h3>
                <div className="mt-5 grid gap-3">
                  {addonOptions.map((addon) => {
                    const active = draft.addons.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() =>
                          updateDraft({
                            addons: active
                              ? draft.addons.filter((id) => id !== addon.id)
                              : [...draft.addons, addon.id]
                          })
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          active ? 'border-[#d6b16a] bg-[#d6b16a]/15' : 'border-white/10 bg-white/[0.05]'
                        }`}
                      >
                        <p className="font-black text-white">{addon.title}</p>
                        <p className="mt-1 text-sm font-bold text-white/45">Rs {formatCurrency(addon.price)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {step === 4 && (
              <div>
                <h3 className="font-luxury text-3xl text-white">Offers and coupons</h3>
                <div className="mt-5 grid gap-3">
                  {bookingOffers.map((offer) => (
                    <button
                      key={offer.offer_code}
                      type="button"
                      onClick={() => updateDraft({ offer: draft.offer === offer.title ? '' : offer.title })}
                      className={`rounded-2xl border p-4 text-left ${
                        draft.offer === offer.title ? 'border-[#d6b16a] bg-[#d6b16a]/15' : 'border-white/10 bg-white/[0.05]'
                      }`}
                    >
                      <p className="font-black text-white">{offer.title}</p>
                      <p className="mt-1 text-sm text-white/52">{offer.discount}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 5 && (
              <div>
                <h3 className="font-luxury text-3xl text-white">Payment</h3>
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                  <p className="font-bold text-white">Demo payment interface</p>
                  <p className="mt-2 leading-7 text-white/55">
                    Payment gateway integration is intentionally kept UI-only in this phase. The next backend phase can connect this step to real payments and invoice records.
                  </p>
                </div>
              </div>
            )}
            {step === 6 && (
              <div className="rounded-3xl border border-[#d6b16a]/25 bg-[#d6b16a]/10 p-8 text-center">
                <ShieldCheck className="mx-auto mb-5 h-14 w-14 text-[#e7c987]" />
                <h3 className="font-luxury text-4xl text-white">Booking request ready</h3>
                <p className="mt-4 text-white/62">
                  {bookingNotice || 'Completing the live booking workflow against available rooms.'}
                </p>
              </div>
            )}
          </div>

          <aside className="rounded-[28px] border border-white/10 bg-black/35 p-5">
            <h3 className="font-luxury text-3xl text-white">Price Summary</h3>
            <SummaryLine label={`${nights} night room total`} value={subtotal} />
            <SummaryLine label="Discount" value={-discount} />
            <SummaryLine label="Taxes" value={taxes} />
            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="flex justify-between">
                <span className="font-bold text-white/55">Final total</span>
                <span className="text-2xl font-black text-[#e7c987]">Rs {formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-8 flex justify-between gap-3">
          <button
            type="button"
            onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
            className="rounded-2xl border border-white/12 px-6 py-3 font-bold text-white/65"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < 6 ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => (step === 5 ? void onConfirm() : setStep(step + 1))}
              className="rounded-2xl bg-[#d6b16a] px-6 py-3 font-black text-black disabled:opacity-50"
            >
              {step === 5 ? 'Confirm Request' : 'Continue'}
            </button>
          ) : (
            <Link to="/user/login" className="rounded-2xl bg-[#d6b16a] px-6 py-3 font-black text-black">
              Open Guest Portal
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryLine: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="mt-4 flex justify-between text-sm">
    <span className="font-bold text-white/45">{label}</span>
    <span className="font-black text-white">{value < 0 ? '-' : ''}Rs {formatCurrency(Math.abs(value))}</span>
  </div>
);

const worldClassDishes = [
  { name: 'Wagyu Beef Tenderloin', origin: 'Japan', price: 'Rs 3,400', note: 'A5 cut, truffle jus, smoked butter mash', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop', bestseller: true },
  { name: 'Lobster Thermidor', origin: 'France', price: 'Rs 3,150', note: 'Classic mustard cream, gruyere gratin', image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=1200&auto=format&fit=crop', bestseller: true },
  { name: 'Saffron Risotto Milanese', origin: 'Italy', price: 'Rs 1,680', note: 'Aged parmesan, white truffle drizzle', image: 'https://images.unsplash.com/photo-1630409346824-4f0e7b080087?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Sushi Omakase Selection', origin: 'Japan', price: 'Rs 2,450', note: 'Chef-curated seasonal nigiri and maki', image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?q=80&w=1200&auto=format&fit=crop', bestseller: true },
  { name: 'Moroccan Lamb Tagine', origin: 'Morocco', price: 'Rs 1,980', note: 'Apricot glaze, saffron couscous, pistachio', image: 'https://images.unsplash.com/photo-1625944525533-473f1b7d54fb?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Butter Chicken Royale', origin: 'India', price: 'Rs 1,240', note: 'Charcoal tandoor finish, saffron naan', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=1200&auto=format&fit=crop', bestseller: true }
];

const diningStats = [
  { label: 'Covers served monthly', value: '12k+' },
  { label: 'Global dishes curated', value: '60+' },
  { label: 'Repeat orders', value: '74%' },
  { label: 'Chef table rating', value: '4.9/5' }
];

const fallbackDiningShowcase: DiningShowcase = {
  most_ordered_title: 'Butter Chicken Royale',
  most_ordered_subtitle: '412 orders this month',
  chef_recommendation_title: 'Wagyu Tenderloin',
  chef_recommendation_subtitle: 'Guests rate it 4.9/5',
  dessert_week_title: 'Belgian Chocolate Dome',
  dessert_week_subtitle: 'Pairs with Ethiopian roast'
};

const DiningSection: React.FC<{ showcase: DiningShowcase; dishes: DiningDish[] }> = ({ showcase, dishes }) => (
  <section id="dining" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
    <SectionHeading
      eyebrow="Dining and Chef"
      title="A world menu, plated with theatre."
      copy="Discover globally celebrated dishes, chef-led tasting experiences, and the most ordered signatures served across our premium dining spaces."
    />
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] mb-8">
      <div className="rounded-[32px] border border-white/10 overflow-hidden bg-white/[0.04]">
        <div className="relative h-[460px]">
          <img
            src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1800&auto=format&fit=crop"
            alt="Fine dining restaurant"
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e7c987] mb-2">Chef Signature Experience</p>
            <h3 className="font-luxury text-5xl text-white">Tasting Menu of 9 Courses</h3>
            <p className="mt-2 text-white/70 font-semibold">French finesse, Asian precision, Indian warmth — one curated journey.</p>
          </div>
        </div>
      </div>
      <div className="grid gap-6">
        {[
          { title: 'Most Ordered Tonight', value: showcase.most_ordered_title, sub: showcase.most_ordered_subtitle },
          { title: 'Chef Recommendation', value: showcase.chef_recommendation_title, sub: showcase.chef_recommendation_subtitle },
          { title: 'Dessert of the Week', value: showcase.dessert_week_title, sub: showcase.dessert_week_subtitle }
        ].map((card) => (
          <div key={card.title} className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e7c987]">{card.title}</p>
            <h3 className="mt-3 font-luxury text-4xl text-white">{card.value}</h3>
            <p className="mt-3 leading-7 text-white/58">{card.sub}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
      {diningStats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-3xl font-luxury text-[#e7c987]">{stat.value}</p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-white/45">{stat.label}</p>
        </div>
      ))}
    </div>

    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {(dishes.length > 0
        ? dishes.map((dish) => ({
            name: dish.name,
            origin: dish.category,
            price: `Rs ${Number(dish.price).toLocaleString('en-IN')}`,
            note: dish.description || 'Chef-crafted premium plating with global influence.',
            image:
              dish.image_url ||
              'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200&auto=format&fit=crop',
            bestseller: Boolean(dish.is_bestseller)
          }))
        : worldClassDishes
      ).map((dish) => (
        <article key={dish.name} className="rounded-[24px] border border-white/10 bg-white/[0.05] overflow-hidden group">
          <div className="relative h-52">
            <img src={dish.image} alt={dish.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
            {dish.bestseller && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1 rounded-full bg-[#d6b16a] px-3 py-1 text-xs font-black text-black">
                <Sparkles className="h-3 w-3" />
                Best Seller
              </span>
            )}
          </div>
          <div className="p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e7c987]">{dish.origin}</p>
            <h4 className="mt-2 text-2xl font-luxury text-white">{dish.name}</h4>
            <p className="mt-2 text-white/60 leading-7">{dish.note}</p>
            <p className="mt-4 text-lg font-black text-[#e7c987]">{dish.price}</p>
          </div>
        </article>
      ))}
    </div>
  </section>
);

const ExperiencesSection: React.FC = () => (
  <section id="experiences" className="bg-[#11100e] px-5 py-24 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        eyebrow="Experiences"
        title="Stay stories, not just rooms."
        copy="Large cinematic cards help guests choose the kind of stay they want before choosing the exact room."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {experiences.map((experience) => (
          <article key={experience.title} className="group relative min-h-[420px] overflow-hidden rounded-[32px]">
            <img src={experience.image} alt={experience.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute bottom-0 p-7">
              <h3 className="font-luxury text-4xl text-white">{experience.title}</h3>
              <p className="mt-4 leading-7 text-white/68">{experience.copy}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const MembershipSection: React.FC = () => {
  const levels = [
    ['Bronze', 25, 'Member rates'],
    ['Silver', 48, 'Dining credits'],
    ['Gold', 72, 'Room upgrades'],
    ['Platinum', 92, 'Concierge privileges']
  ];

  return (
    <section id="membership" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
      <SectionHeading
        eyebrow="Membership"
        title="Loyalty that feels visible."
        copy="Premium cards, reward points, upgrade progress, and clear benefits help guests understand why returning matters."
      />
      <div className="grid gap-5 md:grid-cols-4">
        {levels.map(([level, progress, benefit]) => (
          <div key={level} className="rounded-[28px] border border-[#d6b16a]/20 bg-gradient-to-br from-[#d6b16a]/14 to-white/[0.04] p-6">
            <Gem className="mb-5 h-7 w-7 text-[#e7c987]" />
            <h3 className="font-luxury text-4xl text-white">{level}</h3>
            <p className="mt-2 font-bold text-white/55">{benefit}</p>
            <div className="mt-6 h-2 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#d6b16a]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const ReviewsSection: React.FC = () => (
  <section id="reviews" className="bg-[#11100e] px-5 py-24 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        eyebrow="Reviews"
        title="Trust, shown quietly."
        copy="Ratings, highlights, and guest voices help support conversion without crowding the page."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((review) => (
          <article key={review.name} className="rounded-[28px] border border-white/10 bg-white/[0.05] p-7">
            <div className="mb-5 flex gap-1 text-[#e7c987]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="min-h-28 leading-8 text-white/70">"{review.quote}"</p>
            <p className="mt-6 font-black text-white">{review.name}</p>
            <p className="text-sm font-bold text-white/42">{review.rating} rating</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const ContactSection: React.FC = () => (
  <section id="contact" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
    <SectionHeading
      eyebrow="Contact"
      title="Support before and after booking."
      copy="Fast contact options, WhatsApp, email, and a polished form help guests reach the hotel without searching."
    />
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="grid gap-4">
        {[
          [Phone, '+91 98765 43210', 'Call reservations'],
          [Mail, 'stay@paramvah.example', 'Email support'],
          [MessageCircle, 'WhatsApp concierge', 'Quick replies']
        ].map(([Icon, title, copy]) => (
          <div key={String(title)} className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <Icon className="mb-4 h-6 w-6 text-[#e7c987]" />
            <p className="font-black text-white">{title as string}</p>
            <p className="text-sm font-bold text-white/45">{copy as string}</p>
          </div>
        ))}
      </div>
      <form className="rounded-[32px] border border-white/10 bg-white/[0.05] p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input placeholder="Name" className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 font-bold text-white outline-none placeholder:text-white/35" />
          <input placeholder="Email" className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 font-bold text-white outline-none placeholder:text-white/35" />
          <textarea placeholder="How can we help?" className="min-h-36 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 font-bold text-white outline-none placeholder:text-white/35 md:col-span-2" />
        </div>
        <button type="button" className="mt-5 rounded-2xl bg-[#d6b16a] px-6 py-4 font-black text-black">
          Send Message
        </button>
      </form>
    </div>
  </section>
);

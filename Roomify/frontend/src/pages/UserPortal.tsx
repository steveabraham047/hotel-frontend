import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Repeat2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  UserRound,
  X
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { readApiResponse } from '../utils/apiResponse';
import { offers as fallbackOffers } from '../data/luxuryHotel';

type BookingAddonId = 'airport' | 'breakfast' | 'spa';
const addonOptions: { id: BookingAddonId; title: string; price: number }[] = [
  { id: 'airport', title: 'Airport Transfer', price: 1800 },
  { id: 'breakfast', title: 'Chef Breakfast', price: 1200 },
  { id: 'spa', title: 'Spa Welcome Ritual', price: 2500 }
];

const nightsBetween = (checkIn: string, checkOut: string) => {
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 1;
  return Math.max(1, Math.ceil((end - start) / 86400000));
};

interface GuestProfile {
  guest_id: number;
  name: string;
  email: string;
  phone: string;
}

interface Room {
  room_id: number;
  room_number: string;
  type: string;
  price_per_night: string | number;
  status: string;
}

interface Booking {
  booking_id: number;
  room_id: number;
  room_number: string;
  room_type: string;
  price_per_night: string | number;
  check_in: string;
  check_out: string;
  status: string;
  nights: number;
  estimated_total: string | number;
}

interface PendingPublicBooking {
  room_id?: number;
  roomType?: string;
  check_in?: string;
  check_out?: string;
  addons?: BookingAddonId[];
  offer?: string;
  promo?: string;
}

interface Invoice {
  invoice_id: number;
  booking_id: number;
  invoice_no: string;
  room_total: string | number;
  restaurant_total: string | number;
  grand_total: string | number;
  payment_status: string;
  check_in: string;
  check_out: string;
  room_number: string;
  room_type: string;
}

interface Membership {
  points: number;
  tier: string;
  nextTier: string | null;
  progress: number;
  lifetimeSpend: number;
  totalBookings: number;
  activeBookings: number;
  benefits: string[];
}

interface GuestPreferences {
  guest_id: number;
  room_view: string;
  bed_type: string;
  special_requests: string;
}

interface SavedOffer {
  offer_code: string;
  offer_title: string;
  created_at?: string;
}

interface ApiOffer {
  offer_code: string;
  title: string;
  tag: string;
  discount_label: string;
  discount_type?: string;
  discount_value?: number;
  description: string;
  starts_at?: string | null;
  ends_at: string | null;
}

interface OfferView {
  offer_code: string;
  title: string;
  tag: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  discount_label: string;
  ends: string;
  copy: string;
}

interface PreferencesResponse {
  preferences: GuestPreferences;
  savedRooms: Room[];
  savedOffers: SavedOffer[];
  error?: string;
}

interface ProfileResponse {
  guest?: GuestProfile;
  error?: string;
}

const roomImages = [
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=800&auto=format&fit=crop'
];

const defaultMembership: Membership = {
  points: 0,
  tier: 'Bronze',
  nextTier: 'Silver',
  progress: 0,
  lifetimeSpend: 0,
  totalBookings: 0,
  activeBookings: 0,
  benefits: ['Member-only room rates', 'Priority support']
};

const formatCurrency = (value: string | number) =>
  Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

const getDateInputValue = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

export const UserPortal: React.FC = () => {
  const navigate = useNavigate();
  const hasConsumedPendingIntent = useRef(false);
  const [guest, setGuest] = useState<GuestProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [membership, setMembership] = useState<Membership>(defaultMembership);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [preferences, setPreferences] = useState<GuestPreferences>({
    guest_id: 0,
    room_view: 'Garden view',
    bed_type: 'King bed',
    special_requests: ''
  });
  const [savedRooms, setSavedRooms] = useState<Room[]>([]);
  const [savedOffers, setSavedOffers] = useState<SavedOffer[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [rebooking, setRebooking] = useState<Booking | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingAddons, setBookingAddons] = useState<BookingAddonId[]>([]);
  const [bookingOffer, setBookingOffer] = useState('');
  const [bookingPromo, setBookingPromo] = useState('');
  const [bookingOffers, setBookingOffers] = useState<OfferView[]>([]);
  const [bookingDates, setBookingDates] = useState({
    check_in: getDateInputValue(0),
    check_out: getDateInputValue(1)
  });
  const [loading, setLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Feature 1: Room Service
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [rsOrders, setRsOrders] = useState<any[]>([]);
  const [showRoomService, setShowRoomService] = useState(false);
  const [rsWorking, setRsWorking] = useState(false);

  // Feature 3: Profile Edit
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', newPw: '', confirm: '' });
  const [profileWorking, setProfileWorking] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('guestToken');
    return { Authorization: `Bearer ${token}` };
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('guestToken');
    localStorage.removeItem('guestRole');
    localStorage.removeItem('guestName');
    navigate('/user/login', { replace: true });
  }, [navigate]);

  const fetchPortalData = useCallback(async () => {
    setLoading(true);
    setStatusMsg('');

    try {
      const [profileResponse, bookingsResponse, membershipResponse, invoicesResponse, preferencesResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/user/profile`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/api/user/bookings`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/api/user/membership`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/api/user/invoices`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/api/user/preferences`, { headers: authHeaders() })
        ]);

      if (profileResponse.status === 401 || profileResponse.status === 403) {
        handleLogout();
        return;
      }

      const profileData = await readApiResponse<ProfileResponse>(profileResponse);
      const bookingsData = await readApiResponse<Booking[] | { error?: string }>(bookingsResponse);
      const membershipData = await readApiResponse<Membership | { error?: string }>(membershipResponse);
      const invoicesData = await readApiResponse<Invoice[] | { error?: string }>(invoicesResponse);
      const preferencesData = await readApiResponse<PreferencesResponse>(preferencesResponse);

      if (!profileResponse.ok || !profileData.guest) throw new Error(profileData.error || 'Could not load profile.');
      if (!bookingsResponse.ok || !Array.isArray(bookingsData)) throw new Error(('error' in bookingsData && bookingsData.error) || 'Could not load bookings.');
      if (!membershipResponse.ok || (membershipData as { error?: string }).error) {
        throw new Error((membershipData as { error?: string }).error || 'Could not load membership.');
      }
      if (!invoicesResponse.ok || !Array.isArray(invoicesData)) throw new Error(('error' in invoicesData && invoicesData.error) || 'Could not load invoices.');
      if (!preferencesResponse.ok || preferencesData.error) throw new Error(preferencesData.error || 'Could not load preferences.');

      setGuest(profileData.guest);
      setBookings(bookingsData);
      setMembership(membershipData as Membership);
      setInvoices(invoicesData);
      setPreferences(preferencesData.preferences);
      setSavedRooms(preferencesData.savedRooms);
      setSavedOffers(preferencesData.savedOffers);

      // Pre-fetch room service data so it's ready and history is visible
      await fetchRoomServiceData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load your guest portal.';
      setStatusMsg(message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, handleLogout]);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  // Fetch available rooms whenever dates change without triggering a full portal reload
  useEffect(() => {
    let mounted = true;
    const fetchRooms = async () => {
      try {
        const dateParams = new URLSearchParams({
          check_in: bookingDates.check_in,
          check_out: bookingDates.check_out
        });
        const roomsResponse = await fetch(`${API_BASE_URL}/api/user/rooms/available?${dateParams.toString()}`, { headers: authHeaders() });
        const roomsData = await readApiResponse<Room[] | { error?: string }>(roomsResponse);
        if (roomsResponse.ok && Array.isArray(roomsData) && mounted) {
          setRooms(roomsData);
        }
      } catch {
        // ignore
      }
    };
    fetchRooms();
    return () => { mounted = false; };
  }, [authHeaders, bookingDates.check_in, bookingDates.check_out]);

  useEffect(() => {
    let mounted = true;

    const normalizeOffer = (offer: ApiOffer): OfferView => {
      const normalizedType = String(offer.discount_type || '').toUpperCase() === 'FIXED' ? 'FIXED' : 'PERCENT';
      const value = Number(offer.discount_value || 0);
      return {
        offer_code: offer.offer_code,
        title: offer.title,
        tag: offer.tag,
        discount_type: normalizedType,
        discount_value: Number.isFinite(value) ? value : 0,
        discount_label: offer.discount_label,
        ends: offer.ends_at
          ? `Ends ${new Date(offer.ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
          : 'Limited slots',
        copy: offer.description
      };
    };

    const fetchOffers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/public/offers`);
        const data = await readApiResponse<ApiOffer[] | { error?: string }>(response);
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(('error' in data && data.error) || 'Could not load offers.');
        }
        if (!mounted) return;
        setBookingOffers(data.map(normalizeOffer));
      } catch {
        if (!mounted) return;
        // fallback to static UI offers so the page never breaks
        const fallback: OfferView[] = fallbackOffers.slice(0, 6).map((offer) => ({
          offer_code: offer.title.toLowerCase().replace(/\s+/g, '-'),
          title: offer.title,
          tag: offer.tag,
          discount_type: 'PERCENT',
          discount_value: 15,
          discount_label: offer.discount,
          ends: offer.ends,
          copy: offer.copy
        }));
        setBookingOffers(fallback);
      }
    };

    fetchOffers();
    return () => {
      mounted = false;
    };
  }, []);

  // If the guest started booking from the public preview page, open the same booking flow here.
  useEffect(() => {
    if (hasConsumedPendingIntent.current) return;

    let pending: PendingPublicBooking | null = null;
    try {
      const raw = localStorage.getItem('pendingPublicBooking');
      if (!raw) return;
      pending = JSON.parse(raw) as PendingPublicBooking;
    } catch {
      localStorage.removeItem('pendingPublicBooking');
      return;
    }

    if (!pending) return;

    // Consume once to avoid overwriting user edits on subsequent refetches.
    hasConsumedPendingIntent.current = true;
    localStorage.removeItem('pendingPublicBooking');

    setBookingDates((current) => ({
      check_in: pending.check_in || current.check_in,
      check_out: pending.check_out || current.check_out
    }));

    setBookingAddons(Array.isArray(pending.addons) ? pending.addons : []);
    setBookingOffer(typeof pending.offer === 'string' ? pending.offer : '');
    setBookingPromo(typeof pending.promo === 'string' ? pending.promo : '');

    // Wait until rooms are loaded to pick a room.
    // (This effect re-runs when rooms change, but we early-return after consumption.)
  }, []);

  useEffect(() => {
    if (!hasConsumedPendingIntent.current) return;
    if (selectedRoom) return;

    // If we consumed intent already, attempt to auto-pick a room if one exists.
    // Prefer same room_id or same type if present in the current availability list.
    try {
      const raw = localStorage.getItem('pendingPublicBookingConsumedSnapshot');
      const snapshot = raw ? (JSON.parse(raw) as PendingPublicBooking) : null;
      if (!snapshot) return;
      const desiredRoom =
        (snapshot.room_id ? rooms.find((r) => r.room_id === snapshot.room_id) : null) ||
        (snapshot.roomType ? rooms.find((r) => r.type === snapshot.roomType) : null) ||
        rooms[0] ||
        null;
      if (desiredRoom) {
        setSelectedRoom(desiredRoom);
        setBookingStep(1);
      }
    } catch {
      // ignore
    }
  }, [rooms, selectedRoom]);

  // Persist a snapshot for room auto-selection (so we don't keep reading/clearing the real key).
  useEffect(() => {
    if (hasConsumedPendingIntent.current) return;
    try {
      const raw = localStorage.getItem('pendingPublicBooking');
      if (!raw) return;
      localStorage.setItem('pendingPublicBookingConsumedSnapshot', raw);
    } catch {
      // ignore
    }
  }, []);

  const activeBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        ['active', 'confirmed', 'checked_in', 'pending'].includes(booking.status.toLowerCase())
      ),
    [bookings]
  );

  const bookingHistory = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          !['active', 'confirmed', 'checked_in', 'pending'].includes(booking.status.toLowerCase())
      ),
    [bookings]
  );

  const savedRoomIds = useMemo(() => new Set(savedRooms.map((room) => room.room_id)), [savedRooms]);
  const savedOfferCodes = useMemo(() => new Set(savedOffers.map((offer) => offer.offer_code)), [savedOffers]);

  const requestJson = async <T,>(path: string, body: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await readApiResponse<T & { error?: string; message?: string }>(response);
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  };

  const handleBookingDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBookingDates((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const confirmGuestBooking = async () => {
    const room = selectedRoom;

    if (!room) {
      setStatusMsg('Please choose a room first.');
      return;
    }

    setIsWorking(true);
    setStatusMsg('');

    try {
      const data = await requestJson<{ message?: string }>('/api/user/bookings', {
        room_id: room.room_id,
        check_in: bookingDates.check_in,
        check_out: bookingDates.check_out,
        promo_code: bookingPromo.trim() || undefined,
        offer: bookingOffer.trim() || undefined,
        addons: bookingAddons
      });
      setStatusMsg(data.message || 'Room booked successfully.');
      setSelectedRoom(null);
      setBookingStep(1);
      setBookingAddons([]);
      setBookingOffer('');
      setBookingPromo('');
      await fetchPortalData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not complete your booking.';
      setStatusMsg(message);
    } finally {
      setIsWorking(false);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    setIsWorking(true);
    setStatusMsg('');
    try {
      const data = await requestJson<{ message?: string }>(`/api/user/bookings/${booking.booking_id}/cancel`, {});
      setStatusMsg(data.message || 'Booking cancelled.');
      await fetchPortalData();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Could not cancel booking.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleRebook = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rebooking) return;

    setIsWorking(true);
    setStatusMsg('');
    try {
      const data = await requestJson<{ message?: string }>(`/api/user/bookings/${rebooking.booking_id}/rebook`, {
        check_in: bookingDates.check_in,
        check_out: bookingDates.check_out
      });
      setStatusMsg(data.message || 'Rebooking created.');
      setRebooking(null);
      await fetchPortalData();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Could not rebook this stay.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleToggleSavedRoom = async (room: Room) => {
    setIsWorking(true);
    try {
      await requestJson('/api/user/saved-rooms/toggle', { room_id: room.room_id });
      await fetchPortalData();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Could not update saved rooms.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleToggleSavedOffer = async (offerCode: string, offerTitle: string) => {
    setIsWorking(true);
    try {
      await requestJson('/api/user/saved-offers/toggle', { offer_code: offerCode, offer_title: offerTitle });
      await fetchPortalData();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Could not update saved offers.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsWorking(true);
    setStatusMsg('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      const data = await readApiResponse<{ error?: string; message?: string }>(response);
      if (!response.ok) throw new Error(data.error || 'Could not save preferences.');
      setStatusMsg(data.message || 'Preferences saved.');
      await fetchPortalData();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Could not save preferences.');
    } finally {
      setIsWorking(false);
    }
  };

  // === Feature 1: Room Service Handlers ===
  const fetchRoomServiceData = async () => {
    try {
      const [menuRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/user/menu`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/api/user/room-service/orders`, { headers: authHeaders() })
      ]);
      const menuData = await readApiResponse<any[]>(menuRes);
      const ordersData = await readApiResponse<any[]>(ordersRes);
      if (menuRes.ok && Array.isArray(menuData)) setMenuItems(menuData);
      if (ordersRes.ok && Array.isArray(ordersData)) setRsOrders(ordersData);
    } catch { /* ignore */ }
  };

  const updateCart = (itemId: number, delta: number) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) { const { [itemId]: _, ...rest } = prev; return rest; }
      return { ...prev, [itemId]: next };
    });
  };

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = menuItems.find(m => m.menu_item_id === Number(id));
      return sum + (item ? Number(item.price) * qty : 0);
    }, 0);
  }, [cart, menuItems]);

  const placeRoomServiceOrder = async () => {
    const items = Object.entries(cart).map(([id, qty]) => ({ menu_item_id: Number(id), quantity: qty }));
    if (items.length === 0) return;
    setRsWorking(true);
    try {
      const data = await requestJson<{ message?: string }>('/api/user/room-service', { items });
      setStatusMsg(data.message || 'Room service order placed!');
      setCart({});
      await fetchRoomServiceData();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Could not place order.');
    } finally {
      setRsWorking(false);
    }
  };

  const handleOpenRoomService = async () => {
    setShowRoomService(true);
    await fetchRoomServiceData();
  };

  // === Feature 3: Profile Edit Handlers ===
  const openProfileEdit = () => {
    if (guest) {
      setProfileForm({ name: guest.name, phone: guest.phone });
    }
    setPasswordForm({ current: '', newPw: '', confirm: '' });
    setProfileMsg('');
    setShowProfileEdit(true);
  };

  const handleUpdateProfile = async () => {
    setProfileWorking(true);
    setProfileMsg('');
    try {
      const data = await requestJson<{ message?: string }>('/api/user/profile', profileForm);
      setProfileMsg(data.message || 'Profile updated!');
      await fetchPortalData();
    } catch (error) {
      setProfileMsg(error instanceof Error ? error.message : 'Could not update profile.');
    } finally {
      setProfileWorking(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPw !== passwordForm.confirm) {
      setProfileMsg('New passwords do not match.');
      return;
    }
    setProfileWorking(true);
    setProfileMsg('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/password`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: passwordForm.current, new_password: passwordForm.newPw })
      });
      const data = await readApiResponse<{ error?: string; message?: string }>(response);
      if (!response.ok) throw new Error(data.error || 'Could not change password.');
      setProfileMsg(data.message || 'Password changed!');
      setPasswordForm({ current: '', newPw: '', confirm: '' });
    } catch (error) {
      setProfileMsg(error instanceof Error ? error.message : 'Could not change password.');
    } finally {
      setProfileWorking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070605] flex items-center justify-center text-[#e7c987] font-black text-xl">
        Loading your guest portal...
      </div>
    );
  }

  const nights = nightsBetween(bookingDates.check_in, bookingDates.check_out);
  const selectedNightly = selectedRoom ? Number(selectedRoom.price_per_night) : 0;
  const addonTotal = addonOptions
    .filter((addon) => bookingAddons.includes(addon.id))
    .reduce((sum, addon) => sum + addon.price, 0);
  const subtotal = selectedNightly * nights + addonTotal;
  const selectedOffer = bookingOffers.find((offer) => offer.title === bookingOffer) || null;
  const promoDiscountPercent = bookingPromo.trim().toUpperCase() === 'LUXE15' ? 15 : 0;

  const offerDiscount = selectedOffer
    ? selectedOffer.discount_type === 'FIXED'
      ? Math.round(selectedOffer.discount_value)
      : Math.round((subtotal * selectedOffer.discount_value) / 100)
    : 0;

  const promoDiscount = promoDiscountPercent ? Math.round((subtotal * promoDiscountPercent) / 100) : 0;
  // Do not stack promo + offer: prefer explicit offer selection, else promo.
  const discount = Math.min(subtotal, selectedOffer ? offerDiscount : promoDiscount);
  const taxes = Math.round((subtotal - discount) * 0.12);
  const grandTotal = subtotal - discount + taxes;

  return (
    <div className="min-h-screen bg-[#070605] text-[#f8f1e7]">
      <header className="sticky top-0 z-30 bg-black/75 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#e7c987]">Guest Portal</p>
            <h1 className="text-2xl font-luxury font-black text-white">Paramvah Stays</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-right">
              <div>
                <p className="font-black text-white">{guest?.name}</p>
                <p className="text-xs text-white/45 font-bold">{guest?.email}</p>
              </div>
              <button
                onClick={openProfileEdit}
                className="w-11 h-11 rounded-full bg-[#d6b16a] text-black flex items-center justify-center hover:bg-[#f0d28d] transition-all"
                aria-label="Edit profile"
              >
                <UserRound className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-3 rounded-2xl bg-white/10 text-white/75 font-bold flex items-center gap-2 hover:bg-white/15 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
        {statusMsg && (
          <div className="mb-8 p-4 rounded-2xl bg-[#d6b16a]/12 border border-[#d6b16a]/25 shadow-sm font-bold text-[#e7c987]">
            {statusMsg}
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-8 mb-10">
          <div className="relative overflow-hidden rounded-[28px] min-h-[380px] bg-black text-white p-8 lg:p-10 flex flex-col justify-end border border-white/10">
            <img
              src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1800&auto=format&fit=crop"
              alt="Hotel exterior"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
            <div className="relative z-10 max-w-2xl">
              <p className="uppercase tracking-widest text-[#e7c987] text-xs font-black mb-3">
                Welcome {guest?.name?.split(' ')[0] || 'Guest'}
              </p>
              <h2 className="text-5xl lg:text-6xl font-luxury font-black leading-tight mb-4">
                Your private stay dashboard.
              </h2>
              <p className="text-white/75 text-lg">
                Membership, invoices, saved rooms, favorite offers, preferences, and live booking controls are all synced with your account.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            <MetricCard icon={Clock} value={activeBookings.length} label="Current bookings" />
            <MetricCard icon={BedDouble} value={rooms.length} label="Rooms available" />
            <MetricCard icon={History} value={bookingHistory.length} label="Past stays" />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <MembershipCard membership={membership} />
          <PreferencesCard
            preferences={preferences}
            setPreferences={setPreferences}
            savedRooms={savedRooms}
            savedOffers={savedOffers}
            onSave={handleSavePreferences}
            isWorking={isWorking}
          />
          <BillingCard invoices={invoices} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <SavedOffersCard savedOfferCodes={savedOfferCodes} onToggle={handleToggleSavedOffer} isWorking={isWorking} />
        </section>

        {/* Feature 1: Room Service Section */}
        {activeBookings.length > 0 && (
          <section className="mb-12">
            <div className="rounded-[28px] border border-[#d6b16a]/20 bg-gradient-to-r from-[#d6b16a]/10 to-white/[0.04] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#d6b16a]/20 flex items-center justify-center">
                  <UtensilsCrossed className="w-7 h-7 text-[#e7c987]" />
                </div>
                <div>
                  <h2 className="font-luxury text-2xl font-black text-white">Room Service</h2>
                  <p className="text-white/55 font-bold text-sm mt-1">Order food directly to your room from our menu</p>
                </div>
              </div>
              <button
                onClick={handleOpenRoomService}
                className="px-6 py-3 rounded-2xl bg-[#d6b16a] text-black font-black hover:bg-[#f0d28d] transition-all active:scale-[0.97] flex items-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                Order Now
              </button>
            </div>
            {rsOrders.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rsOrders.slice(0, 3).map(order => (
                  <div key={order.order_id} className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-white">Order #{order.order_id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${order.status === 'Unpaid' ? 'bg-[#d6b16a]/15 text-[#e7c987]' : 'bg-emerald-500/15 text-emerald-400'}`}>{order.status}</span>
                    </div>
                    <p className="text-white/45 font-bold text-sm mt-1">Room {order.room_number} · Rs {formatCurrency(order.total_amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-4xl font-luxury font-black text-white">Available Rooms</h2>
              <p className="text-white/50 font-medium mt-1">These rooms are filtered for your selected check-in / check-out dates.</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 rounded-[24px] border border-white/10 bg-white/[0.06] p-5 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-white/45">Check-in</span>
              <input
                type="date"
                name="check_in"
                value={bookingDates.check_in}
                onChange={handleBookingDateChange}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-bold text-white outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-white/45">Check-out</span>
              <input
                type="date"
                name="check_out"
                value={bookingDates.check_out}
                onChange={handleBookingDateChange}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-bold text-white outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {rooms.length > 0 ? (
              rooms.map((room, index) => (
                <article
                  key={room.room_id}
                  className="bg-white/[0.06] rounded-[24px] overflow-hidden border border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={roomImages[index % roomImages.length]}
                      alt={`Room ${room.room_number}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-4 right-4 bg-[#d6b16a] text-black text-xs font-black px-3 py-1 rounded-full">
                      {room.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleSavedRoom(room)}
                      className="absolute top-4 left-4 rounded-full bg-black/55 p-2 text-white backdrop-blur"
                      aria-label={savedRoomIds.has(room.room_id) ? 'Remove saved room' : 'Save room'}
                    >
                      <Heart className={`h-5 w-5 ${savedRoomIds.has(room.room_id) ? 'fill-[#e7c987] text-[#e7c987]' : ''}`} />
                    </button>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-[#e7c987] mb-2">{room.type}</p>
                    <h3 className="text-2xl font-luxury font-black text-white mb-4">Room {room.room_number}</h3>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-white/45 font-bold">Per night</span>
                      <span className="text-xl text-[#e7c987] font-black">Rs {formatCurrency(room.price_per_night)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRoom(room);
                        setBookingStep(1);
                      }}
                      className="w-full py-3 bg-[#d6b16a] text-black rounded-2xl font-black hover:bg-[#f0d28d] transition-all active:scale-[0.98]"
                    >
                      Book This Room
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="md:col-span-2 xl:col-span-4 bg-white/[0.06] rounded-[24px] p-10 text-center border border-white/10">
                <p className="font-black text-white text-lg">No rooms are available right now.</p>
                <p className="text-white/45 font-medium mt-2">Please check again later or contact reception.</p>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <BookingList
            title="Current Booking"
            emptyText="You do not have an active booking yet."
            bookings={activeBookings}
            onCancel={handleCancelBooking}
            onRebook={setRebooking}
            showCancel
            isWorking={isWorking}
          />
          <BookingList
            title="Booking History"
            emptyText="Completed and cancelled stays will appear here."
            bookings={bookingHistory}
            onRebook={setRebooking}
            isWorking={isWorking}
          />
        </section>
      </main>

      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-[#11100e] p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#e7c987] mb-2">Booking Flow</p>
                <h2 className="text-3xl font-luxury font-black text-white">
                  Room {selectedRoom.room_number} • {selectedRoom.type}
                </h2>
                <p className="text-white/55 font-bold">
                  Rs {formatCurrency(selectedRoom.price_per_night)} / night • {nights} night(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRoom(null);
                  setBookingStep(1);
                }}
                aria-label="Close booking"
                className="rounded-full bg-white/10 p-2 text-white/70"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 grid grid-cols-5 gap-2">
              {['Dates', 'Add-ons', 'Offers', 'Payment', 'Confirm'].map((label, index) => (
                <div key={label} className="min-w-0">
                  <div className={`h-1.5 rounded-full ${bookingStep >= index + 1 ? 'bg-[#d6b16a]' : 'bg-white/12'}`} />
                  <p className="mt-2 truncate text-xs font-bold text-white/45">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="min-h-[240px]">
                {bookingStep === 1 && (
                  <form onSubmit={(e) => { e.preventDefault(); setBookingStep(2); }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-xs font-black uppercase text-white/45">Check-in</span>
                        <input
                          required
                          type="date"
                          name="check_in"
                          value={bookingDates.check_in}
                          onChange={handleBookingDateChange}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 font-bold text-white outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-black uppercase text-white/45">Check-out</span>
                        <input
                          required
                          type="date"
                          name="check_out"
                          value={bookingDates.check_out}
                          onChange={handleBookingDateChange}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 font-bold text-white outline-none"
                        />
                      </label>
                    </div>
                    <button className="w-full rounded-2xl bg-[#d6b16a] py-4 font-black text-black">
                      Continue
                    </button>
                  </form>
                )}

                {bookingStep === 2 && (
                  <div>
                    <h3 className="font-luxury text-2xl text-white">Select add-ons</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {addonOptions.map((addon) => {
                        const active = bookingAddons.includes(addon.id);
                        return (
                          <button
                            key={addon.id}
                            type="button"
                            onClick={() =>
                              setBookingAddons((current) =>
                                active ? current.filter((id) => id !== addon.id) : [...current, addon.id]
                              )
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

                {bookingStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="font-luxury text-2xl text-white">Offers & promo</h3>
                    <input
                      value={bookingPromo}
                      onChange={(e) => setBookingPromo(e.target.value)}
                      placeholder="Promo code (try LUXE15)"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 font-bold text-white outline-none placeholder:text-white/35"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      {bookingOffers.slice(0, 6).map((offer) => (
                        <button
                          key={offer.offer_code}
                          type="button"
                          onClick={() => {
                            setBookingOffer((current) => (current === offer.title ? '' : offer.title));
                            // Selecting an offer should apply discount immediately.
                            // (Discount is derived from bookingOffer state above.)
                          }}
                          className={`rounded-2xl border p-4 text-left ${
                            bookingOffer === offer.title ? 'border-[#d6b16a] bg-[#d6b16a]/15' : 'border-white/10 bg-white/[0.05]'
                          }`}
                        >
                          <p className="font-black text-white">{offer.title}</p>
                          <p className="mt-1 text-sm font-bold text-[#e7c987]">{offer.discount_label}</p>
                          <p className="mt-1 text-xs font-bold text-white/45">{offer.ends}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {bookingStep === 4 && (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                    <h3 className="font-luxury text-2xl text-white">Payment</h3>
                    <p className="mt-2 leading-7 text-white/55">
                      Demo payment step. Your booking will still be created against live availability.
                    </p>
                  </div>
                )}

                {bookingStep === 5 && (
                  <div className="rounded-3xl border border-[#d6b16a]/25 bg-[#d6b16a]/10 p-6 text-center">
                    <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-[#e7c987]" />
                    <h3 className="font-luxury text-3xl text-white">Ready to confirm</h3>
                    <p className="mt-2 text-white/62">We’ll reserve the room for your dates if it’s still available.</p>
                  </div>
                )}
              </div>

              <aside className="rounded-[24px] border border-white/10 bg-black/35 p-5">
                <h3 className="font-luxury text-2xl text-white">Price Summary</h3>
                <div className="mt-4 flex justify-between text-sm">
                  <span className="font-bold text-white/45">{nights} night room total</span>
                  <span className="font-black text-white">Rs {formatCurrency(selectedNightly * nights)}</span>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="font-bold text-white/45">Add-ons</span>
                  <span className="font-black text-white">Rs {formatCurrency(addonTotal)}</span>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="font-bold text-white/45">Discount</span>
                  <span className="font-black text-white">- Rs {formatCurrency(discount)}</span>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="font-bold text-white/45">Taxes</span>
                  <span className="font-black text-white">Rs {formatCurrency(taxes)}</span>
                </div>
                <div className="mt-5 border-t border-white/10 pt-4 flex justify-between">
                  <span className="font-bold text-white/55">Final total</span>
                  <span className="text-xl font-black text-[#e7c987]">Rs {formatCurrency(grandTotal)}</span>
                </div>
              </aside>
            </div>

            <div className="mt-6 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setBookingStep((s) => Math.max(1, s - 1))}
                disabled={bookingStep === 1 || isWorking}
                className="rounded-2xl border border-white/12 px-6 py-3 font-bold text-white/65 disabled:opacity-40"
              >
                Back
              </button>
              {bookingStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setBookingStep((s) => Math.min(5, s + 1))}
                  disabled={isWorking}
                  className="rounded-2xl bg-[#d6b16a] px-6 py-3 font-black text-black disabled:opacity-60"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void confirmGuestBooking()}
                  disabled={isWorking}
                  className="rounded-2xl bg-[#d6b16a] px-6 py-3 font-black text-black disabled:opacity-60"
                >
                  Confirm Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {rebooking && (
        <BookingModal
          title={`Rebook Room ${rebooking.room_number}`}
          subtitle={`Create a new stay for ${rebooking.room_type}`}
          dates={bookingDates}
          onDateChange={handleBookingDateChange}
          onClose={() => setRebooking(null)}
          onSubmit={handleRebook}
          isWorking={isWorking}
          submitLabel="Rebook"
        />
      )}

      {/* Feature 1: Room Service Modal */}
      {showRoomService && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-[28px] border border-white/10 bg-[#11100e] shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#e7c987] mb-1">Room Service</p>
                <h2 className="text-3xl font-luxury font-black text-white">Order from Menu</h2>
              </div>
              <button onClick={() => setShowRoomService(false)} className="rounded-full bg-white/10 p-2 text-white/70"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {menuItems.length > 0 ? menuItems.map(item => {
                const qty = cart[item.menu_item_id] || 0;
                return (
                  <div key={item.menu_item_id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 flex flex-col">
                    {item.image_url && <img src={item.image_url} alt={item.name} className="h-32 w-full object-cover rounded-xl mb-3" />}
                    <p className="font-black text-white text-lg">{item.name}</p>
                    <p className="text-xs font-bold text-white/45 mb-1">{item.category}</p>
                    {item.description && <p className="text-sm text-white/40 mb-2 line-clamp-2">{item.description}</p>}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="text-[#e7c987] font-black text-lg">Rs {formatCurrency(item.price)}</span>
                      {qty === 0 ? (
                        <button onClick={() => updateCart(item.menu_item_id, 1)} className="px-4 py-2 rounded-xl bg-[#d6b16a] text-black font-black text-sm hover:bg-[#f0d28d] transition-all">Add</button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateCart(item.menu_item_id, -1)} className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                          <span className="font-black text-white w-6 text-center">{qty}</span>
                          <button onClick={() => updateCart(item.menu_item_id, 1)} className="w-8 h-8 rounded-lg bg-[#d6b16a] text-black flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <p className="sm:col-span-2 lg:col-span-3 text-center text-white/45 font-bold py-10">No menu items available right now.</p>
              )}
            </div>
            {Object.keys(cart).length > 0 && (
              <div className="p-6 border-t border-white/10 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white/45 font-bold text-sm">{Object.values(cart).reduce((a, b) => a + b, 0)} items</p>
                  <p className="text-[#e7c987] font-black text-xl">Rs {formatCurrency(cartTotal)}</p>
                </div>
                <button
                  onClick={placeRoomServiceOrder}
                  disabled={rsWorking}
                  className="px-8 py-3 rounded-2xl bg-[#d6b16a] text-black font-black hover:bg-[#f0d28d] transition-all disabled:opacity-60"
                >
                  {rsWorking ? 'Placing...' : 'Place Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feature 3: Profile Edit Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#11100e] p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#e7c987] mb-1">Account</p>
                <h2 className="text-3xl font-luxury font-black text-white">Edit Profile</h2>
              </div>
              <button onClick={() => setShowProfileEdit(false)} className="rounded-full bg-white/10 p-2 text-white/70"><X className="h-5 w-5" /></button>
            </div>

            {profileMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-[#d6b16a]/12 border border-[#d6b16a]/25 font-bold text-[#e7c987] text-sm">{profileMsg}</div>
            )}

            <div className="space-y-3 mb-6">
              <label className="block">
                <span className="text-xs font-black uppercase text-white/45">Name</span>
                <input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="mt-1 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 font-bold text-white outline-none" />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase text-white/45">Phone</span>
                <input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="mt-1 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 font-bold text-white outline-none" />
              </label>
              <button onClick={handleUpdateProfile} disabled={profileWorking} className="w-full py-3 rounded-2xl bg-[#d6b16a] text-black font-black hover:bg-[#f0d28d] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                <Edit3 className="w-4 h-4" />
                {profileWorking ? 'Saving...' : 'Update Profile'}
              </button>
            </div>

            <div className="border-t border-white/10 pt-5">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-4 h-4 text-[#e7c987]" />
                <h3 className="font-luxury text-xl text-white">Change Password</h3>
              </div>
              <div className="space-y-3">
                <input type="password" placeholder="Current password" value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 font-bold text-white outline-none placeholder:text-white/35" />
                <input type="password" placeholder="New password" value={passwordForm.newPw} onChange={e => setPasswordForm(p => ({ ...p, newPw: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 font-bold text-white outline-none placeholder:text-white/35" />
                <input type="password" placeholder="Confirm new password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 font-bold text-white outline-none placeholder:text-white/35" />
                <button onClick={handleChangePassword} disabled={profileWorking || !passwordForm.current || !passwordForm.newPw} className="w-full py-3 rounded-2xl bg-white/10 text-white font-black hover:bg-white/15 transition-all disabled:opacity-40">
                  {profileWorking ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, value, label }) => (
  <div className="bg-white/[0.06] rounded-[24px] p-6 border border-white/10 shadow-sm">
    <Icon className="w-6 h-6 text-[#e7c987] mb-4" />
    <p className="text-3xl font-luxury font-black text-white">{value}</p>
    <p className="text-sm font-bold text-white/45 mt-1">{label}</p>
  </div>
);

const MembershipCard: React.FC<{ membership: Membership }> = ({ membership }) => (
  <section className="rounded-[28px] border border-[#d6b16a]/20 bg-gradient-to-br from-[#d6b16a]/16 to-white/[0.04] p-6">
    <Sparkles className="mb-5 h-7 w-7 text-[#e7c987]" />
    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e7c987]">Membership</p>
    <h2 className="mt-2 font-luxury text-4xl text-white">{membership.tier} Tier</h2>
    <p className="mt-3 text-sm font-bold text-white/55">
      {formatCurrency(membership.points)} points
      {membership.nextTier ? `. ${membership.nextTier} unlock progress below.` : '. Highest tier reached.'}
    </p>
    <div className="mt-6 h-2 rounded-full bg-white/10">
      <div className="h-full rounded-full bg-[#d6b16a]" style={{ width: `${membership.progress}%` }} />
    </div>
    <p className="mt-4 text-sm font-bold text-white/45">Lifetime spend: Rs {formatCurrency(membership.lifetimeSpend)}</p>
    <div className="mt-5 grid gap-2 text-sm font-bold text-white/58">
      {membership.benefits.map((benefit) => (
        <span key={benefit}>{benefit}</span>
      ))}
    </div>
  </section>
);

const PreferencesCard: React.FC<{
  preferences: GuestPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<GuestPreferences>>;
  savedRooms: Room[];
  savedOffers: SavedOffer[];
  onSave: () => void;
  isWorking: boolean;
}> = ({ preferences, setPreferences, savedRooms, savedOffers, onSave, isWorking }) => (
  <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6">
    <Bookmark className="mb-5 h-7 w-7 text-[#e7c987]" />
    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e7c987]">Preferences</p>
    <h2 className="mt-2 font-luxury text-4xl text-white">Saved for you</h2>
    <div className="mt-5 grid gap-3">
      <select
        value={preferences.room_view}
        onChange={(event) => setPreferences((current) => ({ ...current, room_view: event.target.value }))}
        className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-bold text-white outline-none"
      >
        <option>Garden view</option>
        <option>City view</option>
        <option>Pool view</option>
        <option>Quiet floor</option>
      </select>
      <select
        value={preferences.bed_type}
        onChange={(event) => setPreferences((current) => ({ ...current, bed_type: event.target.value }))}
        className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-bold text-white outline-none"
      >
        <option>King bed</option>
        <option>Twin beds</option>
        <option>Extra bed</option>
      </select>
      <textarea
        value={preferences.special_requests || ''}
        onChange={(event) => setPreferences((current) => ({ ...current, special_requests: event.target.value }))}
        placeholder="Special requests"
        className="min-h-20 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-bold text-white outline-none placeholder:text-white/35"
      />
      <button
        type="button"
        onClick={onSave}
        disabled={isWorking}
        className="rounded-2xl bg-[#d6b16a] px-4 py-3 font-black text-black disabled:opacity-60"
      >
        Save Preferences
      </button>
    </div>
    <div className="mt-5 flex flex-wrap gap-2">
      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/65">
        {savedRooms.length} saved rooms
      </span>
      <span className="rounded-full bg-[#d6b16a]/12 px-3 py-1 text-xs font-black text-[#e7c987]">
        <Gift className="mr-1 inline h-3 w-3" />
        {savedOffers.length} favorite offers
      </span>
    </div>
  </section>
);

const BillingCard: React.FC<{ invoices: Invoice[] }> = ({ invoices }) => (
  <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6">
    <CreditCard className="mb-5 h-7 w-7 text-[#e7c987]" />
    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e7c987]">Billing</p>
    <h2 className="mt-2 font-luxury text-4xl text-white">Invoices</h2>
    <div className="mt-5 space-y-3">
      {invoices.length > 0 ? (
        invoices.slice(0, 3).map((invoice) => (
          <div key={invoice.invoice_id} className="flex items-center justify-between gap-3 rounded-2xl bg-black/25 px-4 py-3">
            <div>
              <p className="font-black text-white">{invoice.invoice_no}</p>
              <p className="text-xs font-bold text-white/42">
                Room {invoice.room_number} - Rs {formatCurrency(invoice.grand_total)} - {invoice.payment_status}
              </p>
            </div>
            <button className="rounded-full bg-white/10 p-2 text-[#e7c987]" aria-label={`Download ${invoice.invoice_no}`}>
              <Download className="h-4 w-4" />
            </button>
          </div>
        ))
      ) : (
        <p className="rounded-2xl bg-black/25 px-4 py-6 text-center font-bold text-white/45">
          Paid invoices will appear after checkout.
        </p>
      )}
    </div>
  </section>
);

const SavedOffersCard: React.FC<{
  savedOfferCodes: Set<string>;
  onToggle: (offerCode: string, offerTitle: string) => void;
  isWorking: boolean;
}> = ({ savedOfferCodes, onToggle, isWorking }) => (
  <section className="lg:col-span-3 rounded-[28px] border border-white/10 bg-white/[0.06] p-6">
    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e7c987]">Offers</p>
    <h2 className="mt-2 font-luxury text-4xl text-white">Favorite active deals</h2>
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {fallbackOffers.map((offer) => {
        const code = offer.title.toLowerCase().replace(/\s+/g, '-');
        const saved = savedOfferCodes.has(code);
        return (
          <button
            key={offer.title}
            type="button"
            onClick={() => onToggle(code, offer.title)}
            disabled={isWorking}
            className={`rounded-3xl border p-5 text-left transition ${
              saved ? 'border-[#d6b16a] bg-[#d6b16a]/15' : 'border-white/10 bg-black/20 hover:bg-white/10'
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-[#d6b16a] px-3 py-1 text-xs font-black text-black">{offer.tag}</span>
              <Heart className={`h-5 w-5 ${saved ? 'fill-[#e7c987] text-[#e7c987]' : 'text-white/45'}`} />
            </div>
            <p className="font-luxury text-2xl text-white">{offer.title}</p>
            <p className="mt-2 font-black text-[#e7c987]">{offer.discount}</p>
          </button>
        );
      })}
    </div>
  </section>
);

interface BookingListProps {
  title: string;
  emptyText: string;
  bookings: Booking[];
  onCancel?: (booking: Booking) => void;
  onRebook?: (booking: Booking) => void;
  showCancel?: boolean;
  isWorking: boolean;
}

const BookingList: React.FC<BookingListProps> = ({ title, emptyText, bookings, onCancel, onRebook, showCancel, isWorking }) => (
  <section className="bg-white/[0.06] rounded-[24px] border border-white/10 shadow-sm overflow-hidden">
    <div className="p-6 border-b border-white/10 flex items-center gap-3">
      <CalendarDays className="w-5 h-5 text-[#e7c987]" />
      <h2 className="text-3xl font-luxury font-black text-white">{title}</h2>
    </div>
    <div className="p-6 space-y-4">
      {bookings.length > 0 ? (
        bookings.map((booking) => (
          <article key={booking.booking_id} className="p-5 rounded-2xl bg-black/25 border border-white/10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="font-luxury font-black text-white text-2xl">Room {booking.room_number}</p>
                <p className="text-white/45 font-bold text-sm">{booking.room_type}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#d6b16a]/12 text-[#e7c987] text-xs font-black border border-[#d6b16a]/25">
                {booking.status}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-bold text-white/60">
              <span>{formatDate(booking.check_in)}</span>
              <span>{formatDate(booking.check_out)}</span>
              <span className="flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {formatCurrency(booking.estimated_total)}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {showCancel && onCancel && (
                <button
                  type="button"
                  onClick={() => onCancel(booking)}
                  disabled={isWorking}
                  className="rounded-full border border-red-400/30 px-4 py-2 text-sm font-black text-red-200 hover:bg-red-400/10 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              {onRebook && (
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
            </div>
          </article>
        ))
      ) : (
        <p className="text-white/45 font-bold text-center py-8">{emptyText}</p>
      )}
    </div>
  </section>
);

const BookingModal: React.FC<{
  title: string;
  subtitle: string;
  dates: { check_in: string; check_out: string };
  onDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  isWorking: boolean;
  submitLabel: string;
}> = ({ title, subtitle, dates, onDateChange, onClose, onSubmit, isWorking, submitLabel }) => (
  <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
    <form onSubmit={onSubmit} className="bg-[#11100e] rounded-[28px] p-8 max-w-md w-full shadow-2xl border border-white/10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#e7c987] mb-2">Confirm Stay</p>
          <h2 className="text-3xl font-luxury font-black text-white mb-2">{title}</h2>
          <p className="text-white/55 font-bold">{subtitle}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close modal">
          <X className="text-white/55" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <label className="block">
          <span className="text-xs font-black uppercase text-white/45">Check-in</span>
          <input
            required
            type="date"
            name="check_in"
            value={dates.check_in}
            onChange={onDateChange}
            className="mt-2 w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-white font-bold outline-none focus:ring-2 focus:ring-[#d6b16a]/25"
          />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase text-white/45">Check-out</span>
          <input
            required
            type="date"
            name="check_out"
            value={dates.check_out}
            onChange={onDateChange}
            className="mt-2 w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-white font-bold outline-none focus:ring-2 focus:ring-[#d6b16a]/25"
          />
        </label>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl bg-white/10 text-white font-black hover:bg-white/15">
          Cancel
        </button>
        <button type="submit" disabled={isWorking} className="flex-1 py-4 rounded-2xl bg-[#d6b16a] text-black font-black hover:bg-[#f0d28d] disabled:opacity-60">
          {isWorking ? 'Working...' : submitLabel}
        </button>
      </div>
    </form>
  </div>
);

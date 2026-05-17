import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// 1. Accept the props from AppLayout
interface SideNavBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  // Read the user's role from their secure badge
  let userRole = 'Staff'; 
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken: any = jwtDecode(token);
      userRole = decodedToken.role; // e.g., 'Admin', 'Receptionist', 'Waiter'
    }
  } catch (error) {
    console.error("Could not read token details.");
  }

  // Logout functionality
  const handleLogout = () => {
    localStorage.removeItem('token');
    onClose(); // Close the menu when logging out
    navigate('/login');
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    return isActive
      ? "flex items-center gap-4 py-3 px-4 rounded-2xl text-primary relative before:content-[''] before:absolute before:-left-4 before:w-1 before:h-6 before:bg-secondary before:rounded-full font-semibold transition-all translate-x-1"
      : "flex items-center gap-4 py-3 px-4 rounded-2xl text-primary/40 hover:text-primary transition-colors";
  };

  return (
    // 2. The Magic Tailwind Classes for Mobile Sliding!
    <nav className={`
      fixed left-0 top-0 bottom-0 z-50 flex flex-col p-8 w-72 bg-white/90 lg:bg-white/70 backdrop-blur-3xl 
      my-0 ml-0 lg:my-6 lg:ml-6 rounded-r-3xl lg:rounded-[24px] shadow-[20px_0_40px_0_rgba(0,0,0,0.1)] lg:shadow-[0_8px_32px_0_rgba(0,54,8,0.05)]
      transition-transform duration-300 ease-in-out
      lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-[120%]'}
    `}>
      
      {/* Mobile Close Button (Hidden on Desktop) */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-red-50 text-red-500 rounded-full lg:hidden active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>

      <div className="mb-10 flex items-center gap-3 mt-4 lg:mt-0">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
        </div>
        <div>
          <h2 className="text-lg font-black text-primary font-headline leading-tight">The Living Canvas</h2>
          <p className="text-xs font-semibold text-primary/60 uppercase tracking-widest">{userRole} Portal</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {/* EVERYONE SEES THE DASHBOARD OVERVIEW */}
        <NavLink to="/dashboard" end className={getNavLinkClass} onClick={onClose}>
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-body">Overview</span>
        </NavLink>

        {/* ADMIN & RECEPTIONIST ONLY */}
        {(userRole === 'Admin' || userRole === 'Receptionist') && (
          <>
            <NavLink to="/dashboard/guest" className={getNavLinkClass} onClick={onClose}>
              <span className="material-symbols-outlined">group</span>
              <span className="font-body">Guests</span>
            </NavLink>
            <NavLink to="/dashboard/bookings" className={getNavLinkClass} onClick={onClose}>
              <span className="material-symbols-outlined">inventory_2</span>
              <span className="font-body">Bookings</span>
            </NavLink>
            <NavLink to="/dashboard/housekeeping" className={getNavLinkClass} onClick={onClose}>
              <span className="material-symbols-outlined">cleaning_services</span>
              <span className="font-body">Housekeeping</span>
            </NavLink>
            <NavLink to="/dashboard/service-queue" className={getNavLinkClass} onClick={onClose}>
              <span className="material-symbols-outlined">room_service</span>
              <span className="font-body">Service Queue</span>
            </NavLink>
          </>
        )}

        {/* ADMIN & RESTAURANT STAFF ONLY */}
        {(userRole === 'Admin' || userRole === 'Waiter') && (
          <NavLink to="/dashboard/pos" className={getNavLinkClass} onClick={onClose}>
            <span className="material-symbols-outlined">restaurant</span>
            <span className="font-body">Restaurant POS</span>
          </NavLink>
        )}

        {/* ADMIN ONLY (The Secure Registration Door) */}
        {userRole === 'Admin' && (
          <>
            <div className="w-full h-px bg-primary/10 my-4"></div>
            <span className="px-4 text-xs font-black text-primary/30 uppercase tracking-widest mb-2 block">Management</span>
            <NavLink to="/dashboard/rooms" className={getNavLinkClass} onClick={onClose}>
              <span className="material-symbols-outlined">bed</span>
              <span className="font-body">Manage Rooms</span>
            </NavLink>
            <NavLink to="/dashboard/promos" className={getNavLinkClass} onClick={onClose}>
              <span className="material-symbols-outlined">sell</span>
              <span className="font-body">Promo Codes</span>
            </NavLink>
            <NavLink to="/dashboard/dining" className={getNavLinkClass} onClick={onClose}>
              <span className="material-symbols-outlined">restaurant_menu</span>
              <span className="font-body">Dining Highlights</span>
            </NavLink>
            <NavLink to="/dashboard/pricing" className={getNavLinkClass} onClick={onClose}>
              <span className="material-symbols-outlined">price_change</span>
              <span className="font-body">Dynamic Pricing</span>
            </NavLink>
            <NavLink to="/dashboard/reviews" className={getNavLinkClass} onClick={onClose}>
              <span className="material-symbols-outlined">reviews</span>
              <span className="font-body">Reviews</span>
            </NavLink>
            <NavLink to="/dashboard/staff" className={getNavLinkClass} onClick={onClose}>
              <span className="material-symbols-outlined">badge</span>
              <span className="font-body">Manage Staff</span>
            </NavLink>
            <NavLink to="/dashboard/audit" className={getNavLinkClass} onClick={onClose}>
              <span className="material-symbols-outlined">history</span>
              <span className="font-body">Audit Log</span>
            </NavLink>
          </>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-primary/10">
        {/* Only Admins and Receptionists should be able to book rooms */}
        {(userRole === 'Admin' || userRole === 'Receptionist') && (
          <button 
            onClick={() => { navigate('/dashboard/new-booking'); onClose(); }} 
            className="bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined">add_circle</span>
            New Booking
          </button>
        )}

        {/* LOGOUT BUTTON */}
        <button 
          onClick={handleLogout}
          className="bg-red-50 text-red-600 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">logout</span>
          Secure Logout
        </button>
      </div>
    </nav>
  );
};

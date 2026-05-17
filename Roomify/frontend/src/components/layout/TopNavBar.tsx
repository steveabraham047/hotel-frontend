import React from 'react';
import { NotificationBell } from '../NotificationPanel';

// Accept the onMenuClick prop from AppLayout
interface TopNavBarProps {
  onMenuClick: () => void;
  onNotificationClick: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ onMenuClick, onNotificationClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 lg:left-[340px] h-28 z-30 flex items-center justify-between px-4 lg:px-8 pointer-events-none">
      
      {/* MOBILE HAMBURGER BUTTON */}
      <div className="flex items-center gap-4 pointer-events-auto">
        <button 
          onClick={onMenuClick} 
          className="lg:hidden p-3 bg-white/70 backdrop-blur-md text-primary rounded-2xl shadow-sm hover:bg-white transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {/* Paramvah Search Bar */}
      <div className="hidden md:flex flex-1 max-w-2xl mx-auto items-center gap-4 pointer-events-auto">
         <div className="flex-1 bg-white/70 backdrop-blur-md px-6 py-4 rounded-full flex items-center gap-3 shadow-sm border border-white/40">
            {/* --- NAME CHANGED RIGHT HERE --- */}
            <span className="font-bold text-primary whitespace-nowrap">Paramvah</span>
            <span className="w-px h-6 bg-primary/20 mx-2"></span>
            <span className="material-symbols-outlined text-primary/40">search</span>
            <input 
              type="text" 
              placeholder="Search guests, rooms, or events..." 
              className="bg-transparent border-none outline-none text-primary font-medium w-full placeholder:text-primary/40"
            />
         </div>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center gap-4 pointer-events-auto ml-auto">
        <NotificationBell onClick={onNotificationClick} />
        <div className="w-12 h-12 bg-primary rounded-full overflow-hidden border-2 border-white shadow-sm">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D3B2E&color=fff" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
};
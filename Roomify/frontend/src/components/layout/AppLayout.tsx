import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNavBar } from './TopNavBar';
import { SideNavBar } from './SideNavBar';
import { NotificationPanel } from '../NotificationPanel';

export const AppLayout: React.FC = () => {
  // Track if the mobile menu is open
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="bg-landscape min-h-screen selection:bg-secondary-container selection:text-on-secondary-container relative">
      
      {/* 1. Pass the toggle function to the TopNavBar */}
      <TopNavBar onMenuClick={toggleMenu} onNotificationClick={() => setIsNotificationOpen(true)} />

      {/* 2. Add the Mobile Dark Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={closeMenu}
        />
      )}

      {/* 3. Pass the state and close function to the SideNavBar */}
      <SideNavBar isOpen={isMobileMenuOpen} onClose={closeMenu} />

      {/* 4. Notification Panel */}
      <NotificationPanel isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />

      {/* Main Content Area */}
      <main className="lg:ml-[340px] pt-32 px-4 lg:px-8 pb-12 max-w-[1440px] mx-auto min-h-screen transition-all">
        <Outlet />
      </main>
      
      {/* FAB for quick actions */}
      <div className="fixed bottom-8 right-8 z-40">
        <button className="w-16 h-16 bg-secondary text-white rounded-full flex items-center justify-center shadow-[0_16px_32px_rgba(0,107,92,0.3)] hover:scale-110 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-3xl">edit_calendar</span>
        </button>
      </div>
    </div>
  );
};
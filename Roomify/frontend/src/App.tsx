import React from 'react';  
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { GuestDirectory } from './pages/GuestDirectory';
import { Bookings } from './pages/Bookings';
import { Login } from './pages/Login';
import { ManageStaff } from './pages/ManageStaff';
import { ReceptionistPortal } from './pages/ReceptionistPortal';
import { RestaurantPOS } from './pages/RestaurantPOS';
import { AdminRooms } from './pages/AdminRooms';
import { ManagePromos } from './pages/ManagePromos';
import { ManageDining } from './pages/ManageDining';
import { Housekeeping } from './pages/Housekeeping';
import { DynamicPricing } from './pages/DynamicPricing';
import { ReviewModeration } from './pages/ReviewModeration';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserAuth } from './pages/UserAuth';
import { UserPortal } from './pages/UserPortal';
import { UserProtectedRoute } from './components/UserProtectedRoute';
import { LuxuryHome } from './pages/LuxuryHome';
import { AuditLog } from './pages/AuditLog';
import { BoardingPass } from './pages/BoardingPass';
import { ServiceQueue } from './pages/ServiceQueue';

// --- THE FRONT DOOR BOUNCER ---
// Ensures the user is logged in before loading the layout shell
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES (No login required) */}
        <Route path="/login" element={<Login />} />
        <Route path="/user/login" element={<UserAuth />} />
        <Route path="/user/register" element={<UserAuth />} />

        {/* GUEST WORKSPACE */}
        <Route path="/user" element={
          <UserProtectedRoute>
            <UserPortal />
          </UserProtectedRoute>
        } />
        <Route path="/user/boarding-pass/:id" element={
          <UserProtectedRoute>
            <BoardingPass />
          </UserProtectedRoute>
        } />

        {/* PUBLIC HOTEL WEBSITE */}
        <Route path="/" element={<LuxuryHome />} />

        {/* PROTECTED WORKSPACE (Must be logged in to see these) */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }>
          
          {/* --- ADMIN & RECEPTIONIST ONLY --- */}
          <Route index element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="guest" element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
              <GuestDirectory />
            </ProtectedRoute>
          } />
          
          <Route path="bookings" element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
              <Bookings />
            </ProtectedRoute>
          } />
          
          <Route path="new-booking" element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
              <ReceptionistPortal />
            </ProtectedRoute>
          } />

          {/* --- STRICTLY ADMIN ONLY --- */}
          <Route path="staff" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ManageStaff />
            </ProtectedRoute>
          } />
          
          <Route path="rooms" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminRooms />
            </ProtectedRoute>
          } />

          <Route path="promos" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ManagePromos />
            </ProtectedRoute>
          } />

          <Route path="dining" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ManageDining />
            </ProtectedRoute>
          } />

          <Route path="housekeeping" element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
              <Housekeeping />
            </ProtectedRoute>
          } />

          <Route path="pricing" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <DynamicPricing />
            </ProtectedRoute>
          } />

          <Route path="reviews" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ReviewModeration />
            </ProtectedRoute>
          } />

          <Route path="audit" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AuditLog />
            </ProtectedRoute>
          } />

          <Route path="service-queue" element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
              <ServiceQueue />
            </ProtectedRoute>
          } />

          {/* --- EVERYONE ALLOWED (Admin, Receptionist, Waiter) --- */}
          <Route path="pos" element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist', 'Waiter']}>
              <RestaurantPOS />
            </ProtectedRoute>
          } />
          
          <Route path="bookings/:id/boarding-pass" element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
              <BoardingPass />
            </ProtectedRoute>
          } />

          {/* If they type a weird URL inside the dashboard, send them back to the main dash */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

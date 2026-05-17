import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';

export const ManageStaff: React.FC = () => {
  // State to hold the form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Waiter' // Default role
  });
  
  const [statusMsg, setStatusMsg] = useState({ type: '', msg: '' });

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit to your Backend
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg({ type: '', msg: '' });

    try {
      // Get the Admin token to authorize this request
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Assuming your backend checks if the requester is an Admin
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMsg({ type: 'success', msg: `Successfully created ${formData.role} account for ${formData.name}!` });
        // Clear the form
        setFormData({ name: '', email: '', password: '', role: 'Waiter' });
      } else {
        setStatusMsg({ type: 'error', msg: data.error || 'Failed to create account.' });
      }
    } catch (error) {
      setStatusMsg({ type: 'error', msg: 'Server error. Is the backend running?' });
    }
  };

  return (
    <div className="w-full">
      <header className="mb-10">
        <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight">Staff Management</h1>
        <p className="text-on-surface-variant font-medium mt-2">Securely register new employees and assign roles.</p>
      </header>

      <section className="bg-white/60 backdrop-blur-3xl border border-white/40 p-10 lg:p-12 rounded-[24px] shadow-xl max-w-2xl">
        
        {/* Status Messages */}
        {statusMsg.msg && (
          <div className={`mb-6 p-4 rounded-lg font-bold text-sm ${statusMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            {statusMsg.msg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          
          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Full Name Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary uppercase tracking-widest pl-1">Full Name</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-secondary">person</span>
                <input 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/50 border border-primary/10 rounded-2xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary/20 focus:bg-white transition-all outline-none" 
                  placeholder="Employee Name" 
                  type="text"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-secondary">mail</span>
                <input 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/50 border border-primary/10 rounded-2xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary/20 focus:bg-white transition-all outline-none" 
                  placeholder="staff@hotel.com" 
                  type="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary uppercase tracking-widest pl-1">Temporary Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-secondary">lock</span>
                <input 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/50 border border-primary/10 rounded-2xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary/20 focus:bg-white transition-all outline-none" 
                  placeholder="••••••••" 
                  type="password"
                />
              </div>
            </div>

            {/* Role Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary uppercase tracking-widest pl-1">Access Role</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-secondary">badge</span>
                <select 
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-white/50 border border-primary/10 rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-secondary/20 focus:bg-white transition-all outline-none appearance-none"
                >
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Manager">Manager</option>
                  <option value="Receptionist">Receptionist (Rooms & Bookings)</option>
                  <option value="Waiter">Waiter (Restaurant POS)</option>
                  <option value="Chef">Chef (Kitchen Displays)</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">expand_more</span>
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <button 
            className="w-full mt-8 bg-primary hover:bg-primary-container text-white font-headline font-bold py-5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all" 
            type="submit"
          >
            <span className="material-symbols-outlined">person_add</span>
            Create Employee Account
          </button>
        </form>
      </section>
    </div>
  );
};

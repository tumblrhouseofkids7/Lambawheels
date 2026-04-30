import React, { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { updateOwnProfile } from '../services/userService';

const Pending = () => {
  const { user, checkAuth, logout } = useAuthStore();
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone) return;
    setIsSubmitting(true);
    try {
      await updateOwnProfile({ phone });
      await checkAuth(); // refresh user data
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsData = !user?.phone;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border-t-4 border-blue-600 animate-fade-in-up text-center">
        
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
          ⏳
        </div>
        
        <h2 className="text-2xl font-black text-gray-800 mb-2">Account Setup</h2>
        <div className="mb-6">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${needsData ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
            Status: {needsData ? 'Incomplete Profile' : 'Pending Superadmin Approval'}
          </span>
        </div>

        {needsData ? (
          <>
            <p className="text-gray-500 mb-6 text-sm">Please provide your contact number. Your name and email are already linked from your Google account.</p>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name (Already Added)</label>
                <input
                  type="text"
                  readOnly
                  value={user?.name || ''}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Already Added)</label>
                <input
                  type="email"
                  readOnly
                  value={user?.email || ''}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Contact Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter Contact Number"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-70"
              >
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              Your profile is currently <span className="font-bold text-orange-500">Pending Approval</span>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              A Superadmin must verify your account before you can start managing shifts.
            </p>
            <button
              onClick={() => checkAuth()}
              className="w-full bg-gray-100 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
            >
              Refresh Status
            </button>
          </>
        )}

        <button onClick={logout} className="mt-6 text-sm text-blue-600 hover:underline">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Pending;

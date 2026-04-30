import React, { useState, useRef } from 'react';
import useAuthStore from '../store/useAuthStore';
import { updateOwnProfile, uploadProfilePic } from '../services/userService';

const Profile = () => {
  const { user, checkAuth, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateOwnProfile({ name, phone });
      await checkAuth();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview instantly
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);

    setIsUploadingPic(true);
    try {
      await uploadProfilePic(file);
      await checkAuth(); // Refresh with new Cloudinary URL
      setPreviewUrl(null);
    } catch (error) {
      console.error('Failed to upload picture', error);
      setPreviewUrl(null);
    } finally {
      setIsUploadingPic(false);
    }
  };

  const avatarSrc = previewUrl || user?.profilePic;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center relative">

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 text-blue-600 font-semibold text-sm hover:underline"
          >
            Edit
          </button>
        )}

        {/* Profile Picture */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-white ring-2 ring-blue-100"
            />
          ) : (
            <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-md">
              {user?.name?.charAt(0).toUpperCase() || 'F'}
            </div>
          )}

          {/* Camera button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPic}
            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition disabled:opacity-60"
            title="Change photo"
          >
            {isUploadingPic ? (
              <span className="text-xs">⟳</span>
            ) : (
              <span className="text-sm">📷</span>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpg,image/jpeg,image/png"
            onChange={handlePicChange}
            className="hidden"
          />
        </div>

        {isUploadingPic && (
          <p className="text-xs text-blue-500 mb-2">Uploading photo...</p>
        )}

        <h2 className="text-2xl font-black text-gray-800">{user?.name}</h2>
        <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mt-1">{user?.role}</p>

        {isEditing ? (
          <form onSubmit={handleSave} className="mt-8 space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Read-only)</label>
              <input
                type="email"
                readOnly
                value={user?.email || ''}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setName(user?.name || '');
                  setPhone(user?.phone || '');
                }}
                className="flex-1 bg-gray-100 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-70"
              >
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-4 text-left">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
              <p className="text-gray-800 font-medium">{user?.email}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contact Number</p>
              <p className="text-gray-800 font-medium">{user?.phone || 'Not Provided'}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Account Status</p>
                <p className="text-gray-800 font-medium capitalize">{user?.role}</p>
              </div>
              {user?.role === 'foreman' && (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                  Active ✓
                </span>
              )}
            </div>
          </div>
        )}

        {!isEditing && (
          <button
            onClick={logout}
            className="w-full mt-8 bg-red-50 text-red-600 font-bold py-3 px-4 rounded-xl shadow-sm hover:bg-red-100 transition-colors"
          >
            Logout from Portal
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;

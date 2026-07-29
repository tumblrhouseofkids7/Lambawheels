import React, { useState, useEffect } from 'react';
import useSystemUserStore from '../store/useSystemUserStore';
import { Search, Plus, Trash2, X, CheckCircle, ShieldAlert, Eye, User as UserIcon } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const { users, isLoading, fetchUsers, removeUser, addUser, updateUser } = useSystemUserStore();
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'foreman' });

  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyData, setVerifyData] = useState({ id: '', name: '', email: '', phone: '', role: 'foreman' });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    confirmText: 'Confirm',
    type: 'danger'
  });
  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete User',
      message: 'Are you sure you want to permanently delete this user? This will also delete ALL their shifts, production entries, workers, dispatches, and salaries. This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: async () => {
        try {
          await removeUser(id);
          toast.success('User deleted successfully');
        } catch (err) {
          // error handled in store
        }
      }
    });
  };

  const handleBlock = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Block User',
      message: 'Are you sure you want to block this user? They will not be able to access the system.',
      confirmText: 'Block',
      type: 'danger',
      onConfirm: async () => {
        try {
          await updateUser(id, { role: 'blocked' });
          toast.success('User blocked successfully');
        } catch (err) {
          // error handled in store
        }
      }
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await addUser(formData);
      toast.success('User added successfully. They can now log in using Google Auth.');
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', role: 'foreman' });
    } catch (err) {
      // error handled in store
    }
  };

  const openVerifyModal = (user) => {
    setVerifyData({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role === 'pending' || user.role === 'blocked' ? 'foreman' : user.role
    });
    setIsVerifyModalOpen(true);
  };

  const openProfileModal = (user) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(verifyData.id, {
        name: verifyData.name,
        phone: verifyData.phone,
        role: verifyData.role
      });
      toast.success('User verified and profile updated successfully.');
      setIsVerifyModalOpen(false);
    } catch (err) {
      // error handled in store
    }
  };

  const filteredUsers = users?.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const renderRoleBadge = (role) => {
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize
        ${role === 'superadmin' ? 'bg-red-100 text-red-700' :
          role === 'accountant' ? 'bg-blue-100 text-blue-700' :
            role === 'foreman' ? 'bg-orange-100 text-orange-700' :
              role === 'blocked' ? 'bg-gray-800 text-white' :
                'bg-yellow-100 text-yellow-800'}`}
      >
        {role || 'Pending'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Users</h1>
          <p className="text-gray-500">Manage superadmins, accountants, and foremen access.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No system users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {user.profilePic ? (
                          <img src={user.profilePic} alt={user.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                            <UserIcon className="w-4 h-4" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{user.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{user.email || 'N/A'}</td>
                    <td className="p-4">{renderRoleBadge(user.role)}</td>
                    <td className="p-4">
                      {user.googleId ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Google Linked</span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Unlinked</span>
                      )}
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        title="View Profile"
                        onClick={() => openProfileModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {(user.role === 'pending' || user.role === 'blocked') && (
                        <button
                          title="Verify & Assign Role"
                          onClick={() => openVerifyModal(user)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {user.role !== 'superadmin' && user.role !== 'blocked' && (
                        <button
                          title="Block User"
                          onClick={() => handleBlock(user._id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        title="Delete User"
                        onClick={() => handleDelete(user._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No system users found.</div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user._id} className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.name} referrerPolicy="no-referrer" className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                        <UserIcon className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900">{user.name || 'N/A'}</h3>
                      <p className="text-xs text-gray-500 break-all">{user.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div>{renderRoleBadge(user.role)}</div>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                  <div className="text-xs text-gray-500">
                    Status: {user.googleId ? <span className="text-green-600 font-semibold">Google Linked</span> : 'Unlinked'}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => openProfileModal(user)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors bg-white shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {(user.role === 'pending' || user.role === 'blocked') && (
                      <button
                        onClick={() => openVerifyModal(user)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors bg-white shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {user.role !== 'superadmin' && user.role !== 'blocked' && (
                      <button
                        onClick={() => handleBlock(user._id)}
                        className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors bg-white shadow-sm"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors bg-white shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl my-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Add Pre-approved User</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text" required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email" required value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact No (Optional)</label>
                <input
                  type="text" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                  placeholder="+1 234 567 890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  required value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                >
                  <option value="foreman">Foreman</option>
                  <option value="accountant">Accountant</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border rounded-xl font-medium">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium disabled:opacity-50">{isLoading ? 'Adding...' : 'Add User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify User Modal */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border-t-4 border-green-500 my-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Verify User</h2>
                <p className="text-sm text-gray-500 mt-1">{verifyData.email}</p>
              </div>
              <button onClick={() => setIsVerifyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleVerifySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verify Full Name</label>
                <input
                  type="text" required value={verifyData.name}
                  onChange={(e) => setVerifyData({ ...verifyData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact No</label>
                <input
                  type="text" value={verifyData.phone}
                  onChange={(e) => setVerifyData({ ...verifyData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none"
                  placeholder="+1 234 567 890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Approval Role</label>
                <select
                  required value={verifyData.role}
                  onChange={(e) => setVerifyData({ ...verifyData, role: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none"
                >
                  <option value="foreman">Approve as Foreman</option>
                  <option value="accountant">Approve as Accountant</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsVerifyModalOpen(false)} className="flex-1 px-4 py-2 border rounded-xl font-medium">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-medium flex justify-center gap-2 disabled:opacity-50">
                  <CheckCircle className="w-4 h-4 mt-1" /> {isLoading ? 'Verifying...' : 'Approve & Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {isProfileModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl my-8 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-24 relative">
              <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 text-white hover:bg-white/20 p-1 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Added relative and z-10 here to fix the stacking context issue */}
            <div className="relative z-10 px-6 pb-6 text-center -mt-12">
              <div className="inline-block p-1 bg-white rounded-full shadow-lg mb-4">
                {selectedUser.profilePic ? (
                  <img src={selectedUser.profilePic} alt={selectedUser.name} referrerPolicy="no-referrer" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                    <UserIcon className="w-12 h-12" />
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name || 'Unknown User'}</h2>
              <div className="mt-1">{renderRoleBadge(selectedUser.role)}</div>

              <div className="mt-6 space-y-4 text-left border-t border-gray-100 pt-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</p>
                  <p className="text-gray-900 font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact Number</p>
                  <p className="text-gray-900 font-medium">{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Authentication</p>
                  <p className="text-gray-900 font-medium">{selectedUser.googleId ? 'Google Account Linked' : 'Pending Login'}</p>
                </div>
              </div>

              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="mt-8 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
      />
    </div>
  );
};

export default UserManagement;
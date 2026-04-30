import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Search, Users } from 'lucide-react';
import Table from '../components/Table';
import useLabourStore from '../store/useLabourStore';
import toast from 'react-hot-toast';

const GENDERS = ['Male', 'Female', 'Other'];

const emptyForm = { name: '', gender: 'Male', role: 'Labour', labourType: null, assignedForeman: '', basicSalary: 0 };

const LabourManagement = () => {
  const { labours, isLoading, fetchLabours, addLabour, updateLabour, deleteLabour } = useLabourStore();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = add mode
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLabours();
  }, []);



  const openEdit = (labour) => {
    setEditTarget(labour._id);
    const foremanVal = labour.assignedForeman || labour.foreman;
    const foremanName = typeof foremanVal === 'object' && foremanVal !== null ? foremanVal.name : (foremanVal || '');
    
    setForm({
      name: labour.name || '',
      gender: labour.gender || 'Male',
      role: labour.role || 'Labour',
      labourType: labour.labourType || null,
      assignedForeman: foremanName,
      basicSalary: labour.basicSalary || 0,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSubmitting(true);
    let ok;
    if (editTarget) {
      ok = await updateLabour(editTarget, form);
    } else {
      ok = await addLabour(form);
    }
    setSubmitting(false);
    if (ok) {
      setShowModal(false);
      setForm(emptyForm);
    }
  };

  const handleDelete = async (id) => {
    await deleteLabour(id);
    setDeleteConfirm(null);
  };

  const filtered = labours.filter((l) =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    (l.role || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.assignedForeman || l.foreman || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'gender',
      label: 'Gender',
      render: (val) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${val === 'Male'
            ? 'bg-blue-50 text-blue-600 border-blue-200'
            : val === 'Female'
              ? 'bg-pink-50 text-pink-600 border-pink-200'
              : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}>
          {val}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (val, row) => (
        <div className="flex items-center gap-1.5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
            row.role === 'Thakdar'
              ? 'bg-purple-50 text-purple-600 border-purple-200'
              : 'bg-orange-50 text-orange-600 border-orange-200'
          }`}>
            {row.role || 'Labour'}
          </span>
          {row.role === 'Labour' && row.labourType && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold border bg-blue-50 text-blue-600 border-blue-200">
              {row.labourType}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'assignedForeman',
      label: 'Assigned Foreman',
      render: (val, row) => {
        const foremanName = val?.name || val || row.foreman?.name || row.foreman;
        return typeof foremanName === 'string' ? foremanName : <span className="text-gray-600">—</span>;
      }
    },
    {
      key: 'basicSalary',
      label: 'Base Pay',
      render: (val, row) => row.role === 'Labour' ? <span className="font-mono text-gray-600">₹{val || 0}</span> : <span className="text-gray-400">—</span>
    },
  ];

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2">
            <Users size={20} className="text-gray-900" />
            Labour Records
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">{labours.length} total labours registered</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-xl px-3 py-2 w-72">
        <Search size={15} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search by name, role or foreman..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-gray-900 text-sm outline-none flex-1 placeholder-gray-400"
        />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyMessage="No labours found. Add your first labour record."
        actions={(row) => (
          <>
            <button
              onClick={() => openEdit(row)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 transition-all"
              title="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => setDeleteConfirm(row._id)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-2xl fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-900 font-bold text-base">
                {editTarget ? 'Edit Labour' : 'Add New Labour'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter labour name"
                  required
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-black transition-all"
                />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Gender
                </label>
                <div className="flex gap-2">
                  {GENDERS.map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setForm({ ...form, gender: g })}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${form.gender === g
                          ? 'bg-gray-100 border-gray-300 text-gray-900'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Role
                </label>
                <div className="flex gap-2">
                  {['Labour', 'Thakdar'].map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setForm({ ...form, role: r, labourType: null })}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        form.role === r
                          ? 'bg-black border-black text-white'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              
              {form.role === 'Labour' && (
                <div>
                  <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Labour Type
                    <span className="ml-1 text-gray-400 normal-case font-normal">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    {[{ label: 'Simple', value: null }, { label: '4 Die', value: '4 Die' }, { label: '6 Die', value: '6 Die' }].map((opt) => (
                      <button
                        type="button"
                        key={opt.label}
                        onClick={() => setForm({ ...form, labourType: opt.value })}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          form.labourType === opt.value
                            ? 'bg-black border-black text-white'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {form.role === 'Labour' && (
                <div>
                  <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Basic Salary
                  </label>
                  <input
                    type="number"
                    value={form.basicSalary}
                    onChange={(e) => setForm({ ...form, basicSalary: Number(e.target.value) })}
                    placeholder="e.g. 10000"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-black transition-all"
                  />
                </div>
              )}
              <div>
                <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Assigned Foreman
                </label>
                <input
                  type="text"
                  value={form.assignedForeman}
                  onChange={(e) => setForm({ ...form, assignedForeman: e.target.value })}
                  placeholder="Foreman name (optional)"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-black transition-all"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={15} />
                      {editTarget ? 'Update' : 'Add Labour'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-red-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl fade-in">
            <h3 className="text-gray-900 font-bold text-base mb-2">Delete Labour?</h3>
            <p className="text-gray-600 text-sm mb-5">
              This action cannot be undone. The labour record will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabourManagement;

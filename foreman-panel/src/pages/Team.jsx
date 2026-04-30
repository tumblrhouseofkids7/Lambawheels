import React, { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Check, Search, Users, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import useLabourStore from '../store/useLabourStore';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const GENDERS = ['Male', 'Female', 'Other'];

const emptyForm = { name: '', gender: 'Male', role: 'Labour', labourType: null };

const Team = () => {
  const { labours, isLoading, fetchLabours, addLabour, updateLabour, deleteLabour } = useLabourStore();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error("Excel file is empty");
          return;
        }

        let successCount = 0;
        let failCount = 0;
        setSubmitting(true);

        for (const row of jsonData) {
          const rowRole = row.Role || row.role || 'Labour';
          const rowLabourType = rowRole === 'Labour' ? (row.LabourType || row.labourType || null) : null;
          const newLabour = {
            name: row.Name || row.name,
            gender: row.Gender || row.gender || 'Male',
            role: rowRole,
            labourType: rowLabourType
          };
          
          if (!newLabour.name) continue; 

          const ok = await addLabour(newLabour);
          if (ok) successCount++;
          else failCount++;
        }

        setSubmitting(false);
        if (successCount > 0) {
          toast.success(`Successfully added ${successCount} members.`);
        }
        if (failCount > 0) {
          toast.error(`Failed to add ${failCount} members.`);
        }
      } catch (err) {
        setSubmitting(false);
        toast.error("Error reading Excel file");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchLabours();
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (labour) => {
    setEditTarget(labour._id);
    setForm({
      name: labour.name || '',
      gender: labour.gender || 'Male',
      role: labour.role || 'Labour',
      labourType: labour.labourType || null,  // null = Simple Labour
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

  const handleDelete = async () => {
    if (confirmModal.id) {
      await deleteLabour(confirmModal.id);
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const filtered = labours.filter((l) =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    (l.role || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 fade-in">
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title="Delete Team Member?" 
        message="This action cannot be undone. Are you sure you want to remove this worker from your permanent team?" 
        confirmText="Delete" 
        type="danger" 
        onConfirm={handleDelete} 
        onClose={() => setConfirmModal({ isOpen: false, id: null })} 
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            My Team
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">{labours.length} permanent members</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Member</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-green-600/20 ml-2"
        >
          <Upload size={16} />
          <span className="hidden sm:inline">Upload Excel</span>
        </button>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-xl px-3 py-2 max-w-sm">
        <Search size={15} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search by name or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-gray-900 text-sm outline-none flex-1 placeholder-gray-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-5 py-10 text-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-10 text-center text-gray-400 italic">
                    No team members found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-gray-900">{row.name}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                        row.gender === 'Male' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        row.gender === 'Female' ? 'bg-pink-50 text-pink-600 border-pink-200' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {row.gender}
                      </span>
                    </td>
                    <td className="px-5 py-3">
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
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(row)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, id: row._id })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-md shadow-2xl fade-in transform scale-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 font-black text-xl flex items-center gap-2">
                {editTarget ? <Pencil size={20} className="text-blue-600" /> : <Users size={20} className="text-blue-600" />}
                {editTarget ? 'Edit Member' : 'Add Team Member'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-600 text-xs font-bold uppercase tracking-wider block mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold"
                />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-bold uppercase tracking-wider block mb-1.5">
                  Gender
                </label>
                <div className="flex gap-2">
                  {GENDERS.map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setForm({ ...form, gender: g })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        form.gender === g
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-gray-600 text-xs font-bold uppercase tracking-wider block mb-1.5">
                  Role
                </label>
                <div className="flex gap-2">
                  {['Labour', 'Thakdar'].map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setForm({ ...form, role: r, labourType: null })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        form.role === r
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              
              {form.role === 'Labour' && (
                <div>
                  <label className="text-gray-600 text-xs font-bold uppercase tracking-wider block mb-1.5">
                    Labour Type
                    <span className="ml-1 text-gray-400 normal-case font-normal">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    {[{ label: 'Simple', value: null }, { label: '4 Die', value: '4 Die' }, { label: '6 Die', value: '6 Die' }].map((opt) => (
                      <button
                        type="button"
                        key={opt.label}
                        onClick={() => setForm({ ...form, labourType: opt.value })}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                          form.labourType === opt.value
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-gray-400 text-xs mt-1.5">
                    Simple = no sub-type &nbsp;|&nbsp; 4 Die / 6 Die = upgraded labour
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={16} />
                      {editTarget ? 'Update' : 'Save'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;

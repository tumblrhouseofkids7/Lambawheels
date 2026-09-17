import React, { useState, useEffect } from 'react';
import { Calendar, Receipt, FileText, Scale, DollarSign, Building2, Percent, Calculator } from 'lucide-react';
import useIncomingArticleStore from '../store/useIncomingArticleStore';

const IncomingArticlesForm = () => {
  const { addArticle, isLoading, suggestions, fetchSuggestions } = useIncomingArticleStore();

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    billNo: '',
    particulars: '',
    weight: '',
    unitCost: '',
    purchasedFrom: '',
    sgst: '',
    cgst: ''
  });

  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    const weight = parseFloat(formData.weight) || 0;
    const unitCost = parseFloat(formData.unitCost) || 0;
    const sgst = parseFloat(formData.sgst) || 0;
    const cgst = parseFloat(formData.cgst) || 0;
    
    const total = (weight * unitCost) + sgst + cgst;
    setTotalCost(total.toFixed(2));
  }, [formData.weight, formData.unitCost, formData.sgst, formData.cgst]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await addArticle({ ...formData, totalCost });
    if (success) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        billNo: '',
        particulars: '',
        weight: '',
        unitCost: '',
        purchasedFrom: '',
        sgst: '',
        cgst: ''
      });
      setTotalCost(0);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto mt-2 md:mt-0">
      <div className="mb-4 md:mb-6 hidden md:block">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Incoming Articles</h2>
        <p className="text-sm text-gray-500 mt-1">Record details for incoming articles and calculate total cost.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          
          {/* Date */}
          <div className="space-y-1.5 md:space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Calendar className="w-4 h-4 text-gray-400" /> Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-3 md:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50 text-base"
              required
            />
          </div>

          {/* Bill No */}
          <div className="space-y-1.5 md:space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Receipt className="w-4 h-4 text-gray-400" /> Bill No.
            </label>
            <input
              type="text"
              name="billNo"
              value={formData.billNo}
              onChange={handleChange}
              placeholder="Enter Bill Number"
              className="w-full px-4 py-3 md:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50 text-base"
              required
            />
          </div>

          {/* Particulars Of Articles */}
          <div className="space-y-1.5 md:space-y-2 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText className="w-4 h-4 text-gray-400" /> Particulars
            </label>
            <input
              type="text"
              name="particulars"
              value={formData.particulars}
              onChange={handleChange}
              list="particulars-list"
              placeholder="Describe the articles..."
              className="w-full px-4 py-3 md:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50 text-base"
              required
            />
            <datalist id="particulars-list">
              {suggestions?.particulars?.map((item, index) => (
                <option key={index} value={item} />
              ))}
            </datalist>
          </div>

          {/* Purchased From */}
          <div className="space-y-1.5 md:space-y-2 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Building2 className="w-4 h-4 text-gray-400" /> Purchased From
            </label>
            <input
              type="text"
              name="purchasedFrom"
              value={formData.purchasedFrom}
              onChange={handleChange}
              list="purchasedFrom-list"
              placeholder="Vendor / Supplier Name"
              className="w-full px-4 py-3 md:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50 text-base"
              required
            />
            <datalist id="purchasedFrom-list">
              {suggestions?.purchasedFrom?.map((item, index) => (
                <option key={index} value={item} />
              ))}
            </datalist>
          </div>

          {/* Weight */}
          <div className="space-y-1.5 md:space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Scale className="w-4 h-4 text-gray-400" /> Weight
            </label>
            <input
              type="number"
              step="0.01"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-4 py-3 md:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50 text-base"
              required
            />
          </div>

          {/* Unit Cost */}
          <div className="space-y-1.5 md:space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <DollarSign className="w-4 h-4 text-gray-400" /> Unit Cost
            </label>
            <input
              type="number"
              step="0.01"
              name="unitCost"
              value={formData.unitCost}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-4 py-3 md:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50 text-base"
              required
            />
          </div>

          {/* SGST Amount */}
          <div className="space-y-1.5 md:space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Percent className="w-4 h-4 text-gray-400" /> SGST Amount
            </label>
            <input
              type="number"
              step="0.01"
              name="sgst"
              value={formData.sgst}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-4 py-3 md:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50 text-base"
            />
          </div>

          {/* CGST Amount */}
          <div className="space-y-1.5 md:space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Percent className="w-4 h-4 text-gray-400" /> CGST Amount
            </label>
            <input
              type="number"
              step="0.01"
              name="cgst"
              value={formData.cgst}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-4 py-3 md:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50 text-base"
            />
          </div>
        </div>

        {/* Total Cost */}
        <div className="mt-6 md:mt-8 bg-blue-50/50 p-4 md:p-6 rounded-2xl border border-blue-100 flex flex-col items-stretch md:flex-row md:items-center justify-between gap-4 md:gap-4">
          <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-blue-100 rounded-xl text-blue-600">
                <Calculator className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-semibold text-blue-900/60 uppercase tracking-wider">Total Cost</p>
                <p className="text-2xl md:text-3xl font-black text-blue-900">₹ {totalCost}</p>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto px-6 md:px-8 py-3.5 md:py-3 bg-blue-600 hover:bg-blue-700 text-white text-base md:text-lg font-bold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-70"
          >
            {isLoading ? 'Saving...' : 'Save Article'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IncomingArticlesForm;

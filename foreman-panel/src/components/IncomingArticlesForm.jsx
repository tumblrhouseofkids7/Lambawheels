import React, { useState, useEffect } from 'react';
import { Calendar, Receipt, FileText, Scale, DollarSign, Building2, Percent, Calculator, Plus, Trash2 } from 'lucide-react';
import useIncomingArticleStore from '../store/useIncomingArticleStore';

const IncomingArticlesForm = () => {
  const { addArticle, isLoading, suggestions, fetchSuggestions } = useIncomingArticleStore();

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const defaultArticle = {
    particulars: '',
    weight: '',
    unitCost: ''
  };

  const [billDetails, setBillDetails] = useState({
    date: new Date().toISOString().split('T')[0],
    billNo: '',
    purchasedFrom: '',
    sgst: '',
    cgst: '',
    igst: ''
  });

  const [articles, setArticles] = useState([{ ...defaultArticle }]);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    const articlesTotal = articles.reduce((sum, article) => {
      const weight = parseFloat(article.weight) || 0;
      const unitCost = parseFloat(article.unitCost) || 0;
      return sum + (weight * unitCost);
    }, 0);

    const sgst = parseFloat(billDetails.sgst) || 0;
    const cgst = parseFloat(billDetails.cgst) || 0;
    const igst = parseFloat(billDetails.igst) || 0;

    const total = articlesTotal + sgst + cgst + igst;
    setTotalCost(total.toFixed(2));
  }, [articles, billDetails.sgst, billDetails.cgst, billDetails.igst]);

  const handleBillChange = (e) => {
    const { name, value } = e.target;
    setBillDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArticleChange = (index, e) => {
    const { name, value } = e.target;
    const newArticles = [...articles];
    newArticles[index] = { ...newArticles[index], [name]: value };
    setArticles(newArticles);
  };

  const addArticleRow = () => {
    setArticles([...articles, { ...defaultArticle }]);
  };

  const removeArticleRow = (index) => {
    if (articles.length > 1) {
      const newArticles = articles.filter((_, i) => i !== index);
      setArticles(newArticles);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      billDetails,
      articles
    };
    const success = await addArticle(payload);
    if (success) {
      setBillDetails({
        date: new Date().toISOString().split('T')[0],
        billNo: '',
        purchasedFrom: '',
        sgst: '',
        cgst: '',
        igst: ''
      });
      setArticles([{ ...defaultArticle }]);
      setTotalCost(0);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-5xl mx-auto mt-2 md:mt-0">
      <div className="mb-4 md:mb-6 hidden md:block">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Incoming Articles</h2>
        <p className="text-sm text-gray-500 mt-1">Record details for incoming articles for a single vendor bill.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">

        {/* Bill Details Section */}
        <div className="bg-gray-50/50 p-4 md:p-6 rounded-xl border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Bill Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

            {/* Date */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400" /> Date
              </label>
              <input
                type="date"
                name="date"
                value={billDetails.date}
                onChange={handleBillChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-base"
                required
              />
            </div>

            {/* Bill No */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Receipt className="w-4 h-4 text-gray-400" /> Bill No.
              </label>
              <input
                type="text"
                name="billNo"
                value={billDetails.billNo}
                onChange={handleBillChange}
                placeholder="Enter Bill Number"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-base"
                required
              />
            </div>

            {/* Purchased From */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Building2 className="w-4 h-4 text-gray-400" /> Purchased From
              </label>
              <input
                type="text"
                name="purchasedFrom"
                value={billDetails.purchasedFrom}
                onChange={handleBillChange}
                list="purchasedFrom-list"
                placeholder="Vendor / Supplier Name"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-base"
                required
              />
              <datalist id="purchasedFrom-list">
                {suggestions?.purchasedFrom?.map((item, index) => (
                  <option key={index} value={item} />
                ))}
              </datalist>
            </div>

            {/* SGST Amount */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Percent className="w-4 h-4 text-gray-400" /> SGST Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="sgst"
                value={billDetails.sgst}
                onChange={handleBillChange}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-base"
              />
            </div>

            {/* CGST Amount */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Percent className="w-4 h-4 text-gray-400" /> CGST Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="cgst"
                value={billDetails.cgst}
                onChange={handleBillChange}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-base"
              />
            </div>

            {/* IGST Amount */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Percent className="w-4 h-4 text-gray-400" /> IGST Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="igst"
                value={billDetails.igst}
                onChange={handleBillChange}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-base"
              />
            </div>
          </div>
        </div>

        {/* Articles Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Articles</h3>
            <button
              type="button"
              onClick={addArticleRow}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Article
            </button>
          </div>

          <div className="space-y-3">
            {articles.map((article, index) => {
              const rowTotal = ((parseFloat(article.weight) || 0) * (parseFloat(article.unitCost) || 0)).toFixed(2);
              return (
                <div key={index} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 bg-gray-50/30 border border-gray-100 rounded-xl relative">
                  <div className="w-full md:flex-1">
                    <input
                      type="text"
                      name="particulars"
                      value={article.particulars}
                      onChange={(e) => handleArticleChange(index, e)}
                      list="particulars-list"
                      placeholder="Particulars"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm"
                      required
                    />
                    <datalist id="particulars-list">
                      {suggestions?.particulars?.map((item, i) => (
                        <option key={i} value={item} />
                      ))}
                    </datalist>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    <div className="flex-1 md:w-32">
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
                        <span className="pl-3 text-gray-400"><Scale className="w-3.5 h-3.5" /></span>
                        <input
                          type="number"
                          step="0.01"
                          name="weight"
                          value={article.weight}
                          onChange={(e) => handleArticleChange(index, e)}
                          placeholder="Weight"
                          className="w-full px-2 py-2 focus:outline-none text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex-1 md:w-32">
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
                        <span className="pl-3 text-gray-400"><DollarSign className="w-3.5 h-3.5" /></span>
                        <input
                          type="number"
                          step="0.01"
                          name="unitCost"
                          value={article.unitCost}
                          onChange={(e) => handleArticleChange(index, e)}
                          placeholder="Unit Cost"
                          className="w-full px-2 py-2 focus:outline-none text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="hidden md:flex flex-col justify-center px-2 w-28 text-right">
                      <span className="text-xs text-gray-500 font-medium">Sum</span>
                      <span className="text-sm font-bold text-gray-800">₹{rowTotal}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeArticleRow(index)}
                      disabled={articles.length === 1}
                      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${articles.length === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Cost Section */}
        <div className="mt-6 md:mt-8 bg-blue-50/50 p-4 md:p-6 rounded-2xl border border-blue-100 flex flex-col items-stretch md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900/60 uppercase tracking-wider">Grand Total (inc. GST)</p>
              <p className="text-3xl font-black text-blue-900">₹ {totalCost}</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-70"
          >
            {isLoading ? 'Saving...' : 'Save Purchase Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IncomingArticlesForm;

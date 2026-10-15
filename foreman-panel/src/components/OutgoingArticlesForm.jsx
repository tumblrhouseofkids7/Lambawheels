import React, { useState, useEffect } from 'react';
import { Calendar, Receipt, FileText, Scale, DollarSign, Building2, Percent, Calculator, Plus, Trash2, Truck, MapPin, User, Mail, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import useOutgoingArticleStore from '../store/useOutgoingArticleStore';

const OutgoingArticlesForm = () => {
  const { addArticle, isLoading, suggestions, fetchSuggestions } = useOutgoingArticleStore();

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceNo: '',
    state: '',
    stateCode: '',
    vehicleNumber: ''
  });

  const [buyerDetails, setBuyerDetails] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    stateCode: '',
    gstin: '',
    email: ''
  });

  const [consigneeDetails, setConsigneeDetails] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    stateCode: '',
    gstin: '',
    email: ''
  });

  const [copyToConsignee, setCopyToConsignee] = useState(true);

  useEffect(() => {
    if (copyToConsignee) {
      setConsigneeDetails({ ...buyerDetails });
    }
  }, [buyerDetails, copyToConsignee]);

  const defaultGoods = {
    description: '',
    hsnCode: '',
    qty: '',
    uom: 'PCS',
    rate: ''
  };

  const [goods, setGoods] = useState([{ ...defaultGoods }]);
  const [taxes, setTaxes] = useState({
    cgstRate: '',
    sgstRate: ''
  });

  const totalTaxable = goods.reduce((sum, item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    return sum + (qty * rate);
  }, 0);

  const cgstRateNum = parseFloat(taxes.cgstRate) || 0;
  const sgstRateNum = parseFloat(taxes.sgstRate) || 0;
  const cgstAmt = (totalTaxable * cgstRateNum) / 100;
  const sgstAmt = (totalTaxable * sgstRateNum) / 100;
  const grandTotal = totalTaxable + cgstAmt + sgstAmt;

  const handleInvoiceChange = (e) => {
    const { name, value } = e.target;
    setInvoiceDetails(prev => ({ ...prev, [name]: value }));
  };

  const [isBuyerMatched, setIsBuyerMatched] = useState(false);
  const [isConsigneeMatched, setIsConsigneeMatched] = useState(false);

  const findBuyerMatch = (inputName) => {
    if (!inputName || typeof inputName !== 'string') return null;
    const norm = inputName.trim().toLowerCase();
    if (!norm) return null;
    return suggestions?.buyers?.find(
      b => b.name && b.name.trim().toLowerCase() === norm
    );
  };

  const findConsigneeMatch = (inputName) => {
    if (!inputName || typeof inputName !== 'string') return null;
    const norm = inputName.trim().toLowerCase();
    if (!norm) return null;
    return suggestions?.consignees?.find(
      c => c.name && c.name.trim().toLowerCase() === norm
    ) || suggestions?.buyers?.find(
      b => b.name && b.name.trim().toLowerCase() === norm
    );
  };

  const handleBuyerChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      const match = findBuyerMatch(value);
      if (match) {
        setBuyerDetails(prev => ({
          ...prev,
          name: value,
          address: match.address !== undefined ? match.address.trim() : prev.address,
          city: match.city || prev.city,
          state: match.state || prev.state,
          stateCode: match.stateCode || prev.stateCode,
          gstin: match.gstin || prev.gstin,
          email: match.email || prev.email,
        }));
        setIsBuyerMatched(true);
        if (match.state) {
          setInvoiceDetails(prev => ({
            ...prev,
            state: prev.state || match.state,
            stateCode: prev.stateCode || match.stateCode || ''
          }));
        }
        return;
      } else {
        setIsBuyerMatched(false);
      }
    }
    setBuyerDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleBuyerBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'name' && value) {
      const match = findBuyerMatch(value);
      if (match) {
        setBuyerDetails(prev => ({
          ...prev,
          name: match.name || value,
          address: match.address !== undefined ? match.address.trim() : prev.address,
          city: match.city || prev.city,
          state: match.state || prev.state,
          stateCode: match.stateCode || prev.stateCode,
          gstin: match.gstin || prev.gstin,
          email: match.email || prev.email,
        }));
        setIsBuyerMatched(true);
        if (match.state) {
          setInvoiceDetails(prev => ({
            ...prev,
            state: prev.state || match.state,
            stateCode: prev.stateCode || match.stateCode || ''
          }));
        }
      }
    }
  };

  const handleConsigneeChange = (e) => {
    if (copyToConsignee) setCopyToConsignee(false);
    const { name, value } = e.target;
    if (name === 'name') {
      const match = findConsigneeMatch(value);
      if (match) {
        setConsigneeDetails(prev => ({
          ...prev,
          name: value,
          address: match.address !== undefined ? match.address.trim() : prev.address,
          city: match.city || prev.city,
          state: match.state || prev.state,
          stateCode: match.stateCode || prev.stateCode,
          gstin: match.gstin || prev.gstin,
          email: match.email || prev.email,
        }));
        setIsConsigneeMatched(true);
        return;
      } else {
        setIsConsigneeMatched(false);
      }
    }
    setConsigneeDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleConsigneeBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'name' && value) {
      const match = findConsigneeMatch(value);
      if (match) {
        setConsigneeDetails(prev => ({
          ...prev,
          name: match.name || value,
          address: match.address !== undefined ? match.address.trim() : prev.address,
          city: match.city || prev.city,
          state: match.state || prev.state,
          stateCode: match.stateCode || prev.stateCode,
          gstin: match.gstin || prev.gstin,
          email: match.email || prev.email,
        }));
        setIsConsigneeMatched(true);
      }
    }
  };

  const handleGoodsChange = (index, e) => {
    const { name, value } = e.target;
    const newGoods = [...goods];
    newGoods[index] = { ...newGoods[index], [name]: value };
    setGoods(newGoods);
  };

  const handleTaxChange = (e) => {
    const { name, value } = e.target;
    setTaxes(prev => {
      if (name === 'cgstRate') {
        if (!prev.sgstRate || prev.sgstRate === prev.cgstRate) {
          return { cgstRate: value, sgstRate: value };
        }
      }
      return { ...prev, [name]: value };
    });
  };

  const addGoodsRow = () => {
    setGoods([...goods, { ...defaultGoods }]);
  };

  const removeGoodsRow = (index) => {
    if (goods.length > 1) {
      const newGoods = goods.filter((_, i) => i !== index);
      setGoods(newGoods);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Process goods details
    const processedGoods = goods.map(item => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const taxableValue = qty * rate;
      
      return {
        description: item.description,
        hsnCode: item.hsnCode,
        qty,
        uom: item.uom || 'PCS',
        rate,
        taxableValue,
        cgstRate: 0,
        cgstAmt: 0,
        sgstRate: 0,
        sgstAmt: 0,
        amount: taxableValue
      };
    });

    const payload = {
      invoiceDetails,
      buyerDetails,
      consigneeDetails,
      goodsDetails: processedGoods,
      totalTaxableAmount: parseFloat(totalTaxable.toFixed(2)),
      cgstRate: cgstRateNum,
      cgstAmount: parseFloat(cgstAmt.toFixed(2)),
      sgstRate: sgstRateNum,
      sgstAmount: parseFloat(sgstAmt.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2))
    };

    const success = await addArticle(payload);
    if (success) {
      setInvoiceDetails({
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceNo: '',
        state: '',
        stateCode: '',
        vehicleNumber: ''
      });
      setBuyerDetails({
        name: '', address: '', city: '', state: '', stateCode: '', gstin: '', email: ''
      });
      setConsigneeDetails({
        name: '', address: '', city: '', state: '', stateCode: '', gstin: '', email: ''
      });
      setCopyToConsignee(true);
      setIsBuyerMatched(false);
      setIsConsigneeMatched(false);
      setGoods([{ ...defaultGoods }]);
      setTaxes({ cgstRate: '', sgstRate: '' });
    }
  };

  return (
    <div className="bg-white p-4 sm:p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-5xl mx-auto mt-2 md:mt-0">
      <div className="mb-4 md:mb-6 hidden md:block">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Outgoing Articles</h2>
        <p className="text-sm text-gray-500 mt-1">Generate Tax Invoice / Delivery Challan.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">

        {/* Invoice Details Section */}
        <div className="bg-gray-50/50 p-4 md:p-6 rounded-xl border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Invoice Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400" /> Invoice Date
              </label>
              <input type="date" name="invoiceDate" value={invoiceDetails.invoiceDate} onChange={handleInvoiceChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-base" required />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Receipt className="w-4 h-4 text-gray-400" /> Invoice No.
              </label>
              <input type="text" name="invoiceNo" value={invoiceDetails.invoiceNo} onChange={handleInvoiceChange} placeholder="Enter Invoice Number" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-base" required />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Truck className="w-4 h-4 text-gray-400" /> Vehicle Number
              </label>
              <input type="text" name="vehicleNumber" value={invoiceDetails.vehicleNumber} onChange={handleInvoiceChange} list="vehicles-list" placeholder="Enter Vehicle No" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-base" />
              <datalist id="vehicles-list">
                {suggestions?.vehicles?.map((v, i) => <option key={i} value={v} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MapPin className="w-4 h-4 text-gray-400" /> State
              </label>
              <input type="text" name="state" value={invoiceDetails.state} onChange={handleInvoiceChange} placeholder="e.g. Punjab" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-base" required />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4 text-gray-400" /> State Code
              </label>
              <input type="text" name="stateCode" value={invoiceDetails.stateCode} onChange={handleInvoiceChange} placeholder="e.g. 03" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-base" required />
            </div>
          </div>
        </div>

        {/* Parties Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          
          {/* Buyer Details */}
          <div className="bg-blue-50/30 p-4 md:p-6 rounded-xl border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2 flex items-center gap-2">
              <User className="w-5 h-5" /> Buyer (Billed To)
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-gray-700">Name</label>
                  {isBuyerMatched && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Buyer Matched (Autofilled)
                    </span>
                  )}
                </div>
                <input 
                  type="text" 
                  name="name" 
                  value={buyerDetails.name} 
                  onChange={handleBuyerChange} 
                  onBlur={handleBuyerBlur}
                  list="buyerNames-list" 
                  placeholder="Buyer Name" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" 
                  required 
                />
                <datalist id="buyerNames-list">
                  {Array.from(new Set([
                    ...(suggestions?.buyerNames || []),
                    ...(suggestions?.buyers?.map(b => b.name) || [])
                  ])).filter(Boolean).map((n, i) => <option key={i} value={n} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <textarea name="address" value={buyerDetails.address} onChange={handleBuyerChange} placeholder="Full Address" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" rows="2" required></textarea>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                  <input type="text" name="city" value={buyerDetails.city} onChange={handleBuyerChange} list="cities-list" placeholder="City" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" required />
                  <datalist id="cities-list">
                    {suggestions?.cities?.map((c, i) => <option key={i} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">GSTIN / UIN</label>
                  <input type="text" name="gstin" value={buyerDetails.gstin} onChange={handleBuyerChange} list="gstins-list" placeholder="GSTIN" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
                  <datalist id="gstins-list">
                    {suggestions?.gstins?.map((g, i) => <option key={i} value={g} />)}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                  <input type="text" name="state" value={buyerDetails.state} onChange={handleBuyerChange} list="states-list" placeholder="State" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" required />
                  <datalist id="states-list">
                    {suggestions?.states?.map((s, i) => <option key={i} value={s} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">State Code</label>
                  <input type="text" name="stateCode" value={buyerDetails.stateCode} onChange={handleBuyerChange} list="stateCodes-list" placeholder="Code" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" required />
                  <datalist id="stateCodes-list">
                    {suggestions?.stateCodes?.map((s, i) => <option key={i} value={s} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email (Optional)</label>
                <input type="email" name="email" value={buyerDetails.email} onChange={handleBuyerChange} placeholder="Email" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
              </div>
            </div>
          </div>

          {/* Consignee Details */}
          <div className="bg-purple-50/30 p-4 md:p-6 rounded-xl border border-purple-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-purple-200 pb-2 gap-2">
               <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                 <Truck className="w-5 h-5" /> Consignee (Shipped To)
               </h3>
               <button type="button" onClick={() => setCopyToConsignee(!copyToConsignee)} className="flex items-center gap-1.5 text-sm font-medium text-purple-700 hover:text-purple-800 bg-purple-100/50 px-2 py-1 rounded-md transition-colors">
                 {copyToConsignee ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                 Same as Buyer
               </button>
            </div>
            
            <div className={`space-y-4 transition-opacity ${copyToConsignee ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-gray-700">Name</label>
                  {isConsigneeMatched && !copyToConsignee && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      Consignee Matched (Autofilled)
                    </span>
                  )}
                </div>
                <input 
                  type="text" 
                  name="name" 
                  value={consigneeDetails.name} 
                  onChange={handleConsigneeChange} 
                  onBlur={handleConsigneeBlur}
                  list="consigneeNames-list" 
                  placeholder="Consignee Name" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm" 
                  required 
                />
                <datalist id="consigneeNames-list">
                  {Array.from(new Set([
                    ...(suggestions?.consigneeNames || []),
                    ...(suggestions?.consignees?.map(c => c.name) || []),
                    ...(suggestions?.buyerNames || [])
                  ])).filter(Boolean).map((n, i) => <option key={i} value={n} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <textarea name="address" value={consigneeDetails.address} onChange={handleConsigneeChange} placeholder="Full Address" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm" rows="2" required></textarea>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                  <input type="text" name="city" value={consigneeDetails.city} onChange={handleConsigneeChange} list="cities-list" placeholder="City" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">GSTIN / UIN</label>
                  <input type="text" name="gstin" value={consigneeDetails.gstin} onChange={handleConsigneeChange} list="gstins-list" placeholder="GSTIN" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                  <input type="text" name="state" value={consigneeDetails.state} onChange={handleConsigneeChange} list="states-list" placeholder="State" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">State Code</label>
                  <input type="text" name="stateCode" value={consigneeDetails.stateCode} onChange={handleConsigneeChange} list="stateCodes-list" placeholder="Code" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email (Optional)</label>
                <input type="email" name="email" value={consigneeDetails.email} onChange={handleConsigneeChange} placeholder="Email" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Goods Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Goods Details</h3>
            <button
              type="button"
              onClick={addGoodsRow}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {goods.map((item, index) => {
              const qty = parseFloat(item.qty) || 0;
              const rate = parseFloat(item.rate) || 0;
              const itemTotal = qty * rate;

              return (
                <div key={index} className="p-3.5 bg-gray-50/70 border border-gray-200 rounded-xl relative shadow-2xs hover:border-gray-300 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-4">
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Description of Goods</label>
                      <input 
                        type="text" 
                        name="description" 
                        value={item.description} 
                        onChange={(e) => handleGoodsChange(index, e)} 
                        list="goods-list" 
                        placeholder="Product Name" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white" 
                        required 
                      />
                      <datalist id="goods-list">
                        {suggestions?.goods?.map((g, i) => <option key={i} value={g} />)}
                      </datalist>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">HSN Code</label>
                      <input 
                        type="text" 
                        name="hsnCode" 
                        value={item.hsnCode} 
                        onChange={(e) => handleGoodsChange(index, e)} 
                        list="hsn-list" 
                        placeholder="HSN" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white" 
                        required 
                      />
                      <datalist id="hsn-list">
                        {suggestions?.hsn?.map((h, i) => <option key={i} value={h} />)}
                      </datalist>
                    </div>

                    <div className="md:col-span-2 flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Qty</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          name="qty" 
                          value={item.qty} 
                          onChange={(e) => handleGoodsChange(index, e)} 
                          placeholder="0" 
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white" 
                          required 
                        />
                      </div>
                      <div className="w-14">
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">UOM</label>
                        <div className="w-full px-2 py-2 border border-gray-200 rounded-lg bg-gray-100 text-xs text-gray-700 text-center font-bold cursor-not-allowed">PCS</div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Rate</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400 text-sm">₹</span>
                        <input 
                          type="number" 
                          step="0.01" 
                          name="rate" 
                          value={item.rate} 
                          onChange={(e) => handleGoodsChange(index, e)} 
                          placeholder="0.00" 
                          className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white" 
                          required 
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between gap-2">
                      <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 border border-gray-200 text-right h-[38px] flex items-center justify-end">
                        <span className="text-xs text-gray-500 mr-2">Total:</span>
                        <span className="font-bold text-gray-800 text-sm">₹{itemTotal.toFixed(2)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGoodsRow(index)}
                        disabled={goods.length === 1}
                        className={`p-2 rounded-lg transition-colors flex-shrink-0 h-[38px] w-[38px] flex items-center justify-center ${goods.length === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Tax & Grand Total Section */}
        <div className="mt-6 md:mt-8 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-5 md:p-6 rounded-2xl border border-blue-100 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left: Overall CGST and SGST Inputs */}
            <div className="lg:col-span-7 bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-blue-100 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <Percent className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">GST on Overall Price of Goods</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CGST */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase">CGST Rate (%)</label>
                    <span className="text-xs font-bold text-blue-600">₹{cgstAmt.toFixed(2)}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      name="cgstRate"
                      value={taxes.cgstRate}
                      onChange={handleTaxChange}
                      placeholder="e.g. 9"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-semibold bg-white"
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">%</span>
                  </div>
                </div>

                {/* SGST */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase">SGST Rate (%)</label>
                    <span className="text-xs font-bold text-blue-600">₹{sgstAmt.toFixed(2)}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      name="sgstRate"
                      value={taxes.sgstRate}
                      onChange={handleTaxChange}
                      placeholder="e.g. 9"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-semibold bg-white"
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Summary Breakdown & Action */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5 text-sm bg-white/80 p-3.5 rounded-xl border border-blue-100">
                <div className="flex justify-between text-gray-600">
                  <span className="font-medium text-xs uppercase text-gray-500">Total Goods Price:</span>
                  <span className="font-bold text-gray-900">₹{totalTaxable.toFixed(2)}</span>
                </div>
                {cgstRateNum > 0 && (
                  <div className="flex justify-between text-gray-600 text-xs">
                    <span>CGST ({cgstRateNum}%):</span>
                    <span className="font-semibold text-gray-700">+₹{cgstAmt.toFixed(2)}</span>
                  </div>
                )}
                {sgstRateNum > 0 && (
                  <div className="flex justify-between text-gray-600 text-xs">
                    <span>SGST ({sgstRateNum}%):</span>
                    <span className="font-semibold text-gray-700">+₹{sgstAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
                  <span className="font-bold text-gray-900 text-sm">Grand Total:</span>
                  <span className="text-2xl font-black text-blue-700">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Saving...' : 'Generate Invoice'}
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};

export default OutgoingArticlesForm;

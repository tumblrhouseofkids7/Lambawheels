import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, Calculator, Info } from 'lucide-react';
import useContractorSalaryStore from '../store/useContractorSalaryStore';
import ExportButton from '../components/ExportButton';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const startYear = 2026;
const YEARS = Array.from({ length: Math.max(currentYear - startYear + 6, 6) }, (_, i) => startYear + i);

export default function ContractorSalary() {
  const {
    contractors,
    isLoading,
    fetchContractorSalaries
  } = useContractorSalaryStore();

  const [selectedStartDate, setStartDate] = useState('');
  const [selectedEndDate, setEndDate] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleMonthSelect = (monthStr, yearStr) => {
    const month = parseInt(monthStr);
    const year = parseInt(yearStr);

    const pad = (n) => n.toString().padStart(2, '0');
    const startStr = `${year}-${pad(month)}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endStr = `${year}-${pad(month)}-${pad(lastDay)}`;

    setStartDate(startStr);
    setEndDate(endStr);
  };

  const startD = new Date(selectedStartDate);
  const dropdownMonth = !isNaN(startD) ? startD.getMonth() + 1 : (new Date().getMonth() + 1);
  const dropdownYear = !isNaN(startD) ? startD.getFullYear() : currentYear;

  const handleFetch = () => {
    if (!selectedStartDate || !selectedEndDate) return toast.error('Select start and end date');
    fetchContractorSalaries(selectedStartDate, selectedEndDate);
    setHasSearched(true);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Contractor (Thakadar) Salary: ${selectedStartDate} to ${selectedEndDate}`, 14, 15);
    
    const tableColumn = ["SR.NO", "NAME", "GENDER", "WORKING DAYS", "TOTAL DISPATCH", "RATE (Rs)", "SALARY (Rs)"];
    const tableRows = [];

    contractors.forEach((c, i) => {
      tableRows.push([
        i + 1,
        c.name,
        c.gender,
        c.workingDays,
        c.totalDispatch,
        c.dispatchRate,
        c.totalSalary
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save(`thakadar-salary-${selectedStartDate}-to-${selectedEndDate}.pdf`);
  };

  return (
    <div className="space-y-8 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2">
            <Truck size={20} className="text-gray-900" />
            Contractor (Thakadar) Salary
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">Manage Thakadar payouts based on monthly dispatch production.</p>
        </div>
        {contractors.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow"
            >
              Download PDF
            </button>
            <ExportButton
              data={contractors.map((c, i) => ({
                'SR.NO': i + 1,
                'NAME': c.name,
                'GENDER': c.gender,
                'WORKING DAYS': c.workingDays,
                'TOTAL DISPATCH': c.totalDispatch,
                'DISPATCH RATE (₹)': c.dispatchRate,
                'TOTAL SALARY (₹)': c.totalSalary
              }))}
              filename={`thakadar-salary-${selectedStartDate}-to-${selectedEndDate}`}
              label="Export Excel"
            />
          </div>
        )}
      </div>

      {/* Select Period */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-3">
          Select Period
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border-r border-gray-200 pr-3">
            <select
              value={dropdownMonth}
              onChange={(e) => handleMonthSelect(e.target.value, dropdownYear)}
              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-900 text-sm outline-none focus:border-black transition-all font-medium"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={dropdownYear}
              onChange={(e) => handleMonthSelect(dropdownMonth, e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-900 text-sm outline-none focus:border-black transition-all font-medium"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-500">From</span>
            <input
              type="date"
              value={selectedStartDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-gray-900 text-sm outline-none focus:border-black transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-500">To</span>
            <input
              type="date"
              value={selectedEndDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-gray-900 text-sm outline-none focus:border-black transition-all"
            />
          </div>
          
          <button
            onClick={handleFetch}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-black/10 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Calculator size={16} />
            )}
            Calculate Salary
          </button>
        </div>
      </div>

      {/* Main Table */}
      {hasSearched ? (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
            <p className="text-sm font-medium text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              Showing <span className="font-bold text-black">{contractors.length}</span> Thakadars
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-semibold w-16">SR.NO</th>
                  <th className="p-4 font-semibold">THAKADAR NAME</th>
                  <th className="p-4 font-semibold">GENDER</th>
                  <th className="p-4 font-semibold text-center">WORKING DAYS</th>
                  <th className="p-4 font-semibold text-center border-x border-gray-200 bg-amber-50 text-amber-800">TOTAL DISPATCH</th>
                  <th className="p-4 font-semibold text-center border-r border-gray-200">DISPATCH RATE (₹)</th>
                  <th className="p-4 font-semibold text-center bg-gray-100 text-gray-800">TOTAL SALARY (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {contractors.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400">
                      No Thakadars found in the system.
                    </td>
                  </tr>
                ) : (
                  contractors.map((c, index) => (
                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono text-gray-500">{index + 1}</td>
                      <td className="p-4 font-medium text-gray-900">{c.name}</td>
                      <td className="p-4 text-gray-600">{c.gender}</td>
                      <td className="p-4 text-center font-mono font-semibold text-gray-700">
                        {c.workingDays}
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-amber-700 bg-amber-50/50 border-x border-gray-200">
                        {c.totalDispatch.toLocaleString()}
                      </td>
                      <td className="p-4 text-center border-r border-gray-200">
                        <span className="font-mono text-blue-600 font-bold">{c.dispatchRate || 0}</span>
                      </td>
                      <td className="p-4 text-center font-mono font-black text-black bg-gray-50 text-lg">
                        ₹{(c.totalSalary || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-10 text-center text-gray-500">
          Select a start and end date, then click Calculate Salary to view Thakadar payouts.
        </div>
      )}
    </div>
  );
}

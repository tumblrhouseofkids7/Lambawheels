import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, CheckCircle2, XCircle, Save, CalendarDays, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportButton from '../components/ExportButton';
import useSalaryStore from '../store/useSalaryStore';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const startYear = 2026;
const YEARS = Array.from({ length: Math.max(currentYear - startYear + 6, 6) }, (_, i) => startYear + i);

export default function SalarySheet() {
  const {
    salarySheet,
    isGenerating,
    isLoading,
    selectedStartDate,
    selectedEndDate,
    setStartDate,
    setEndDate,
    generateSalary,
    clearSheet
  } = useSalaryStore();

  const [statusFilter, setStatusFilter] = useState('All');

  const handleDownloadPDF = () => {
    if (!salarySheet.length) return;
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Salary Sheet`, 14, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${selectedStartDate} to ${selectedEndDate}`, 14, 22);

    const tableColumn = ["SR", "NAME", "BASIC", "DAYS", "1-HR RT", "OT HR", "OT AMT", "BONUS", "SALARY AMT", "PREV ADV", "CURR ADV", "NET PAY", "PAID", "STATUS"];
    const tableRows = salarySheet.map((row, i) => {
      const derived = calculateDerived(row);
      return [
        i + 1,
        `${row.labour?.name || '—'} ${row.labour?.labourType && row.labour.labourType !== 'Simple' ? `(${row.labour.labourType})` : ''}`.trim(),
        row.basicSalary || 0,
        row.presentDays || 0,
        derived.oneHourRate,
        row.overtimeHours || 0,
        derived.otAmount,
        row.bonus || 0,
        derived.salaryAmount,
        row.previousAdvance || 0,
        row.currentAdvance || 0,
        derived.netPayable,
        row.salaryPaidAmount || 0,
        row.status || 'Pending'
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const statusCol = data.column.index === 13;
          if (statusCol) {
            const val = data.cell.raw;
            data.cell.styles.textColor = val === 'Paid' ? [22, 163, 74] : [217, 119, 6];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    doc.save(`salary-${selectedStartDate}-to-${selectedEndDate}.pdf`);
  };

  const handleGenerate = () => {
    generateSalary(selectedStartDate, selectedEndDate);
  };

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

  const calculateDerived = (row) => {
    const basic = row.basicSalary || 0;
    const days = row.presentDays || 0;
    const bonus = row.bonus || 0;

    const oneDayRate = basic / 30;
    const oneHourRate = oneDayRate / 12;
    const otAmount = Math.round(oneHourRate * (row.overtimeHours || 0));

    // User requested: Basic + OT + Bonus (no prorating by days)
    const salaryAmount = Math.round(basic + otAmount + bonus);

    const prevAdv = row.previousAdvance || 0;
    const currAdv = row.currentAdvance || 0;

    const netPayable = salaryAmount - prevAdv - currAdv;
    const paid = row.salaryPaidAmount || 0;
    const remainingAdvance = paid - netPayable;

    return {
      oneHourRate: oneHourRate.toFixed(2),
      salaryAmount: Math.round(salaryAmount),
      otAmount: otAmount,
      netPayable: Math.round(netPayable),
      remainingAdvance: Math.round(remainingAdvance),
      isPaid: paid > 0 && paid >= Math.round(netPayable)
    };
  };

  const start = new Date(selectedStartDate);
  const end = new Date(selectedEndDate);
  const daysArray = [];

  if (!isNaN(start) && !isNaN(end) && start <= end) {
    let current = new Date(start);
    while (current <= end) {
      daysArray.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  }

  const formatDateHeader = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredData = salarySheet.filter(row =>
    statusFilter === 'All' ? true : (row.status || 'Pending') === statusFilter
  );

  return (
    <div className="space-y-8 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2">
            <FileText size={20} className="text-gray-900" />
            Salary Sheet
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">Generate and manage monthly salary data</p>
        </div>
        {salarySheet.length > 0 && (
          <div className="flex items-center gap-3">

            <ExportButton
              data={salarySheet.map((row, i) => {
                const derived = calculateDerived(row);
                return {
                  'SR.NO': i + 1,
                  'NAME': `${row.labour?.name || '—'} ${row.labour?.labourType && row.labour.labourType !== 'Simple' ? `(${row.labour.labourType})` : ''}`.trim(),
                  'BASIC SALARY': row.basicSalary || 0,
                  'MONTH DAYS': row.monthDays,
                  'DAYS': row.presentDays,
                  '1-HR RATE': derived.oneHourRate,
                  'OVER TIME HOUR': row.overtimeHours,
                  'OVER TIME AMOUNT': derived.otAmount,
                  'BONUS ON PRODUC': row.bonus,
                  'SALARY AMOUNT': derived.salaryAmount,
                  'PREVIOUS ADVANCE': row.previousAdvance,
                  'CURRENT ADVANCE': row.currentAdvance,
                  'NET SALARY PAYABLE': derived.netPayable,
                  'SALARY PAID': row.salaryPaidAmount,
                  'STATUS': row.status || 'Pending'
                };
              })}
              filename={`salary-${selectedStartDate}-to-${selectedEndDate}`}
              label="Export Excel"
              className="print:hidden"
            />
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-gray-900/20"
            >
              <Printer size={16} />
              Download PDF
            </button>
          </div>
        )}
      </div>

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
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-black/10 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            Generate Salary
          </button>
          {salarySheet.length > 0 && (
            <button
              onClick={clearSheet}
              className="px-4 py-2.5 text-gray-500 hover:text-red-600 text-sm transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      {/* Main Table Container */}
      {salarySheet.length > 0 ? (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
              {['All', 'Paid', 'Pending'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${statusFilter === filter ? 'bg-black text-white shadow' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              Showing <span className="font-bold text-black">{filteredData.length}</span> records
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-3 font-semibold">SR.NO</th>
                  <th className="p-3 font-semibold">NAME</th>
                  <th className="p-3 font-semibold">BASIC SALARY</th>
                  <th className="p-3 font-semibold">MONTH DAYS</th>
                  <th className="p-3 font-semibold">DAYS</th>
                  <th className="p-3 font-semibold">1-HR RATE</th>
                  <th className="p-3 font-semibold">O.T. HOURS</th>
                  <th className="p-3 font-semibold border-x border-gray-200">O.T. AMOUNT</th>
                  <th className="p-3 font-semibold border-x border-gray-200">BONUS</th>
                  <th className="p-3 font-semibold border-x border-gray-200 bg-gray-50">SALARY AMOUNT</th>
                  <th className="p-3 font-semibold border-x border-gray-200">PREV ADV</th>
                  <th className="p-3 font-semibold border-x border-gray-200">CURR ADV</th>
                  <th className="p-3 font-semibold border-x border-gray-200 bg-gray-100">NET PAYABLE</th>
                  <th className="p-3 font-semibold border-x border-gray-200">SALARY PAID</th>
                  <th className="p-3 font-semibold">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {filteredData.map((row, index) => {
                  const derived = calculateDerived(row);

                  return (
                    <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-mono text-gray-500">{index + 1}</td>
                      <td className="p-3 font-medium text-gray-900">
                        <div className="flex flex-col">
                          <span>{row.labour?.name || '—'}</span>
                          {row.labour?.labourType && row.labour.labourType !== 'Simple' && (
                            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                              {row.labour.labourType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-blue-600 font-bold">{row.basicSalary || 0}</span>
                      </td>
                      <td className="p-3 text-center font-mono bg-gray-50">{row.monthDays}</td>
                      <td className="p-3 text-center font-mono bg-emerald-50 text-emerald-700 font-semibold">{row.presentDays}</td>
                      <td className="p-3 font-mono text-gray-500 bg-gray-50 text-center">
                        ₹{derived.oneHourRate}
                      </td>
                      <td className="p-3 text-center text-blue-700 font-bold">
                        {row.overtimeHours || 0} hr
                      </td>
                      <td className="p-3 font-mono text-gray-800 font-bold text-center border-x border-gray-200">
                        ₹{derived.otAmount}
                      </td>
                      <td className="p-3 border-x border-gray-200">
                        <span className="font-mono text-gray-800 font-bold">{row.bonus || 0}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-black bg-gray-50 border-x border-gray-200">
                        ₹{derived.salaryAmount.toLocaleString()}
                      </td>
                      <td className="p-3 border-x border-gray-200">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-gray-800 font-bold">{row.previousAdvance || 0}</span>
                          {row.previousAdvanceNote && (
                            <span className="text-[10px] text-gray-500">{row.previousAdvanceNote}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 border-x border-gray-200">
                        <div className="flex flex-col gap-1 items-center">
                          <span className={`font-mono font-bold text-center ${row.status === 'Paid' && row.currentAdvance > 0 ? 'text-green-700 bg-green-50 px-2 rounded' : (row.currentAdvance > 0 ? 'text-red-600 bg-red-50 px-2 rounded' : 'text-gray-800')}`}>
                            {row.currentAdvance || 0}
                          </span>
                          {row.currentAdvance > 0 && (
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${row.status === 'Paid' ? 'text-green-600' : 'text-red-500'}`}>
                              {row.status === 'Paid' ? 'Deducted' : 'Not Deducted'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-black text-black bg-gray-100 text-lg border-x border-gray-200">
                        ₹{derived.netPayable.toLocaleString()}
                      </td>
                      <td className="p-3 border-x border-gray-200">
                        <span className="font-mono text-black font-bold">{row.salaryPaidAmount || 0}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-3 py-1.5 rounded-xl font-bold text-xs text-center ${row.status === 'Paid' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}
                        >
                          {row.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Daily Attendance Matrix */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-gray-900 font-bold text-md flex items-center gap-2 mb-4">
              <CalendarDays size={18} className="text-gray-700" />
              Daily Attendance Breakdown
            </h3>
            <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-center border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-semibold">
                    <th className="p-2 text-left min-w-[150px] border-r border-gray-200">Labour Name</th>
                    {daysArray.map(day => (
                      <th key={day} className="p-2 min-w-[40px] border-r border-gray-200 text-[10px] whitespace-normal leading-tight">
                        {formatDateHeader(day)}
                      </th>
                    ))}
                    <th className="p-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs font-mono">
                  {salarySheet.map(row => {
                    const attendance = row.attendance || {};
                    return (
                      <tr key={`att-${row._id}`} className="hover:bg-gray-50 transition-colors">
                        <td className="p-2 text-left font-medium text-gray-900 border-r border-gray-200">
                          {row.labour?.name || '—'}
                        </td>
                        {daysArray.map(day => {
                          const status = attendance[day];
                          return (
                            <td key={day} className="p-2 border-r border-gray-200">
                              {status === 'P' ? (
                                <span className="text-green-600 font-bold">P</span>
                              ) : status === 'A' ? (
                                <span className="text-red-500 font-bold">A</span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-2 text-emerald-600 font-bold bg-emerald-50">
                          {row.presentDays}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        !isGenerating && (
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-10 text-center text-gray-500">
            Select a start and end date, then click Generate Salary to view the sheet.
          </div>
        )
      )}
    </div>
  );
};


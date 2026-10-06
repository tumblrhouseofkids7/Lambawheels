import React, { useState, useEffect } from 'react';
import { Calendar, Download, FileText, Search } from 'lucide-react';
import useOutgoingArticleStore from '../store/useOutgoingArticleStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const OutgoingArticlesList = () => {
  const { articles, fetchArticles, isLoading } = useOutgoingArticleStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchArticles(startDate, endDate);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Add Title
    doc.setFontSize(18);
    doc.text('Outgoing Articles Report', 14, 22);
    
    // Add Date Range info if present
    doc.setFontSize(11);
    let dateInfo = 'All Time';
    if (startDate && endDate) {
      dateInfo = `${startDate} to ${endDate}`;
    } else if (startDate) {
      dateInfo = `From ${startDate}`;
    } else if (endDate) {
      dateInfo = `Up to ${endDate}`;
    }
    doc.text(`Date Range: ${dateInfo}`, 14, 30);
    
    // Table data
    const tableColumn = ["Date", "Invoice No", "Buyer", "Consignee", "Vehicle No", "Grand Total"];
    const tableRows = [];

    let totalAmount = 0;

    articles.forEach(article => {
      const rowData = [
        article.invoiceDetails?.invoiceDate ? new Date(article.invoiceDetails.invoiceDate).toLocaleDateString() : 'N/A',
        article.invoiceDetails?.invoiceNo || 'N/A',
        article.buyerDetails?.name || 'N/A',
        article.consigneeDetails?.name || 'N/A',
        article.invoiceDetails?.vehicleNumber || 'N/A',
        article.grandTotal?.toFixed(2) || '0.00'
      ];
      tableRows.push(rowData);
      totalAmount += article.grandTotal || 0;
    });

    // Add totals row
    tableRows.push(["", "", "", "", "Total", totalAmount.toFixed(2)]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Outgoing_Articles_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="bg-white p-4 sm:p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 mt-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Outgoing Invoices List</h2>
          <p className="text-sm text-gray-500 mt-1">View and download your outgoing invoices</p>
        </div>
        
        <button
          onClick={handleDownloadPDF}
          disabled={articles.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-4 mb-6 items-end">
        <div className="flex-1 w-full">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
            <Calendar className="w-4 h-4 text-gray-400" /> Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
            <Calendar className="w-4 h-4 text-gray-400" /> End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold rounded-xl transition-colors h-[42px] flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          Filter
        </button>
      </form>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading invoices...</div>
      ) : articles.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-3 text-sm font-semibold text-gray-600">Date</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Invoice No</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Buyer</th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-right">Grand Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-3 text-sm text-gray-700">{article.invoiceDetails?.invoiceDate ? new Date(article.invoiceDetails.invoiceDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-3 text-sm text-gray-700">{article.invoiceDetails?.invoiceNo}</td>
                  <td className="p-3 text-sm text-gray-700 font-medium">{article.buyerDetails?.name}</td>
                  <td className="p-3 text-sm text-gray-700 font-bold text-right">{article.grandTotal?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No invoices found for the selected period.</p>
        </div>
      )}
    </div>
  );
};

export default OutgoingArticlesList;

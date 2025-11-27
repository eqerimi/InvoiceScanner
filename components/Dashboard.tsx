import React from 'react';
import { Invoice } from '../types';
import { FileText, Download, TrendingUp, Calendar, Hash } from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
}

export const Dashboard: React.FC<DashboardProps> = ({ invoices }) => {
  const downloadCSV = () => {
    if (invoices.length === 0) return;
    
    const headers = ["Invoice Date", "Due Date", "Vendor", "Invoice #", "Net", "Tax", "Total", "Currency", "IBAN"];
    const rows = invoices.map(inv => [
      inv.invoice_date,
      inv.due_date || "",
      `"${inv.vendor_name}"`, 
      inv.invoice_number,
      inv.net_amount,
      inv.tax_amount,
      inv.total_amount,
      inv.currency,
      inv.iban || ""
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invoice_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalProcessed = invoices.length;
  const totalValue = invoices.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-invoice-100 text-invoice-600 rounded-lg">
              <FileText size={18} />
            </div>
            <span className="text-sm text-gray-500 font-medium">Invoices</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalProcessed}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <TrendingUp size={18} />
            </div>
            <span className="text-sm text-gray-500 font-medium">Payable</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">€{totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Recent Invoices</h2>
        <button 
          onClick={downloadCSV}
          disabled={invoices.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No invoices yet</h3>
            <p className="text-gray-500 mt-1">Scan an invoice to start tracking expenses.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Vendor</th>
                  <th className="px-6 py-3 font-medium">Invoice #</th>
                  <th className="px-6 py-3 font-medium">Due Date</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv, idx) => (
                  <tr key={inv.id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{inv.vendor_name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                          {inv.invoice_date}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-1">
                            <Hash size={12} className="text-gray-400" />
                            {inv.invoice_number}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {inv.due_date ? (
                          <div className="flex items-center gap-1 text-invoice-700 bg-invoice-50 px-2 py-1 rounded-md w-fit">
                            <Calendar size={12} /> {inv.due_date}
                          </div>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="font-bold text-gray-900">
                            {inv.currency} {inv.total_amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400">
                           Tax: {inv.tax_amount.toFixed(2)}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
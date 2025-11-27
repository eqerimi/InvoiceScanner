import React from 'react';
import { KescoBill } from '../types';
import { FileText, Download, TrendingUp, Search } from 'lucide-react';

interface DashboardProps {
  bills: KescoBill[];
}

export const Dashboard: React.FC<DashboardProps> = ({ bills }) => {
  const downloadCSV = () => {
    if (bills.length === 0) return;
    
    const headers = ["Customer ID", "Name", "Month", "Date", "A1 (High)", "A2 (Low)", "Total (€)"];
    const rows = bills.map(bill => [
      bill.customer_id,
      `"${bill.customer_name}"`, // Quote name in case of commas
      bill.billing_month,
      bill.invoice_date,
      bill.meter_readings.A1_high_tariff,
      bill.meter_readings.A2_low_tariff,
      bill.total_amount_eur
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invoicescanner_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalProcessed = bills.length;
  const totalValue = bills.reduce((acc, curr) => acc + (Number(curr.total_amount_eur) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-invoice-100 text-invoice-600 rounded-lg">
              <FileText size={18} />
            </div>
            <span className="text-sm text-gray-500 font-medium">Bills Processed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalProcessed}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <TrendingUp size={18} />
            </div>
            <span className="text-sm text-gray-500 font-medium">Total Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">€{totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Recent Scans</h2>
        <button 
          onClick={downloadCSV}
          disabled={bills.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {bills.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No bills scanned yet</h3>
            <p className="text-gray-500 mt-1">Start by scanning a physical invoice.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium text-right">Consumption (A1/A2)</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bills.map((bill, idx) => (
                  <tr key={bill.id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {bill.billing_month}
                      <div className="text-xs text-gray-400">{bill.invoice_date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{bill.customer_name}</div>
                      <div className="text-xs text-gray-500">{bill.customer_id}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-600">
                      <div><span className="text-xs text-gray-400 mr-1">H:</span>{bill.meter_readings.A1_high_tariff}</div>
                      <div><span className="text-xs text-gray-400 mr-1">L:</span>{bill.meter_readings.A2_low_tariff}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      €{bill.total_amount_eur.toFixed(2)}
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
import React, { useState, useEffect } from 'react';
import { Invoice, ValidationResult } from '../types';
import { Save, AlertTriangle, CheckCircle2, ArrowLeft, Calendar, CreditCard } from 'lucide-react';

interface ReviewFormProps {
  initialData: Invoice;
  onSave: (data: Invoice) => void;
  onCancel: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Invoice>(initialData);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, calculatedTotal: 0, diffPercent: 0 });

  // Accounting Validation: Net + Tax should equal Total
  useEffect(() => {
    const calculateValidation = () => {
      const net = Number(formData.net_amount) || 0;
      const tax = Number(formData.tax_amount) || 0;
      const declaredTotal = Number(formData.total_amount) || 0;

      const calculated = net + tax;
      
      if (declaredTotal === 0) {
         setValidation({ isValid: false, calculatedTotal: calculated, diffPercent: 100 });
         return;
      }

      const diff = Math.abs(calculated - declaredTotal);
      const diffPercent = (diff / declaredTotal) * 100;
      
      // Allow 2% margin for rounding errors
      const isValid = diffPercent <= 2; 

      setValidation({
        isValid,
        calculatedTotal: calculated,
        diffPercent
      });
    };

    calculateValidation();
  }, [formData]);

  const handleChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-300 pb-12">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Scan
        </button>
        <h2 className="text-xl font-bold text-gray-800">Review Invoice</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Validation Banner */}
        <div className={`p-4 border-b ${validation.isValid ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className="flex gap-3">
             {validation.isValid ? (
               <CheckCircle2 className="text-green-600 shrink-0" />
             ) : (
               <AlertTriangle className="text-amber-600 shrink-0" />
             )}
             <div>
               <h3 className={`font-semibold ${validation.isValid ? 'text-green-800' : 'text-amber-800'}`}>
                 {validation.isValid ? 'Math Verified' : 'Amount Mismatch'}
               </h3>
               <p className={`text-sm mt-1 ${validation.isValid ? 'text-green-700' : 'text-amber-700'}`}>
                 {validation.isValid 
                   ? 'Net + Tax matches the Total amount.' 
                   : `Net + Tax (${validation.calculatedTotal.toFixed(2)}) does not equal Total (${formData.total_amount}). Check amounts.`}
               </p>
             </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Header Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Vendor Name</span>
                <input
                  type="text"
                  required
                  value={formData.vendor_name || ''}
                  onChange={(e) => handleChange('vendor_name', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-invoice-500 focus:ring-invoice-500 bg-gray-50 border p-2"
                />
              </label>
              
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Invoice Number</span>
                <input
                  type="text"
                  required
                  value={formData.invoice_number || ''}
                  onChange={(e) => handleChange('invoice_number', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-invoice-500 focus:ring-invoice-500 bg-gray-50 border p-2"
                />
              </label>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Calendar size={14} /> Invoice Date
                </span>
                <input
                  type="date"
                  required
                  value={formData.invoice_date || ''}
                  onChange={(e) => handleChange('invoice_date', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-invoice-500 focus:ring-invoice-500 bg-gray-50 border p-2"
                />
              </label>

               <label className="block">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Calendar size={14} /> Due Date
                </span>
                <input
                  type="date"
                  value={formData.due_date || ''}
                  onChange={(e) => handleChange('due_date', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-invoice-500 focus:ring-invoice-500 bg-gray-50 border p-2"
                />
              </label>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Financials */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Financial Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block">
                  <span className="text-xs font-bold text-gray-500 uppercase">Net (Subtotal)</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-gray-400 font-bold">{formData.currency}</span>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.net_amount || 0}
                        onChange={(e) => handleChange('net_amount', parseFloat(e.target.value))}
                        className="block w-full rounded-md border-gray-200 shadow-sm focus:border-invoice-500 focus:ring-invoice-500 font-mono p-1"
                    />
                  </div>
                </label>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block">
                  <span className="text-xs font-bold text-gray-500 uppercase">Tax Amount</span>
                   <div className="flex items-center gap-2 mt-2">
                    <span className="text-gray-400 font-bold">{formData.currency}</span>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.tax_amount || 0}
                        onChange={(e) => handleChange('tax_amount', parseFloat(e.target.value))}
                        className="block w-full rounded-md border-gray-200 shadow-sm focus:border-invoice-500 focus:ring-invoice-500 font-mono p-1"
                    />
                  </div>
                </label>
              </div>

              <div className="bg-invoice-50 p-4 rounded-xl border border-invoice-200">
                <label className="block">
                  <span className="text-xs font-bold text-invoice-700 uppercase">Total Amount</span>
                   <div className="flex items-center gap-2 mt-2">
                    <span className="text-invoice-600 font-bold">{formData.currency}</span>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.total_amount || 0}
                        onChange={(e) => handleChange('total_amount', parseFloat(e.target.value))}
                        className="block w-full rounded-md border-invoice-200 shadow-sm focus:border-invoice-500 focus:ring-invoice-500 font-mono font-bold text-invoice-900 p-1 bg-white"
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Payment Info */}
          <div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                    <CreditCard size={16} /> Payment IBAN / Account Number
                </span>
                <input
                  type="text"
                  value={formData.iban || ''}
                  placeholder="e.g. XK55..."
                  onChange={(e) => handleChange('iban', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-invoice-500 focus:ring-invoice-500 bg-gray-50 border p-2 font-mono text-sm"
                />
              </label>
          </div>

        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-white transition-colors"
          >
            Discard
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-invoice-600 text-white rounded-xl font-semibold shadow-md hover:bg-invoice-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Confirm & Save
          </button>
        </div>
      </form>
    </div>
  );
};
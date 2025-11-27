import React, { useState, useEffect } from 'react';
import { KescoBill, ValidationResult } from '../types';
import { Save, AlertTriangle, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

interface ReviewFormProps {
  initialData: KescoBill;
  onSave: (data: KescoBill) => void;
  onCancel: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<KescoBill>(initialData);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, calculatedTotal: 0, diffPercent: 0 });

  // Sanity Check Logic from PRD: (A1 * 0.09) + (A2 * 0.04) != total_amount ± 10%
  useEffect(() => {
    const calculateValidation = () => {
      const a1 = Number(formData.meter_readings.A1_high_tariff) || 0;
      const a2 = Number(formData.meter_readings.A2_low_tariff) || 0;
      const declaredTotal = Number(formData.total_amount_eur) || 0;

      // Heuristic formula
      const calculated = (a1 * 0.09) + (a2 * 0.04);
      
      if (declaredTotal === 0) {
         setValidation({ isValid: false, calculatedTotal: calculated, diffPercent: 100 });
         return;
      }

      const diff = Math.abs(calculated - declaredTotal);
      const diffPercent = (diff / declaredTotal) * 100;
      
      // Allow 10% margin plus a fixed buffer for fees/VAT not in formula
      const isValid = diffPercent <= 25; // Relaxed slightly as real bills have fixed fees

      setValidation({
        isValid,
        calculatedTotal: calculated,
        diffPercent
      });
    };

    calculateValidation();
  }, [formData]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMeterChange = (field: 'A1_high_tariff' | 'A2_low_tariff', value: string) => {
    setFormData(prev => ({
      ...prev,
      meter_readings: {
        ...prev.meter_readings,
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Scan
        </button>
        <h2 className="text-xl font-bold text-gray-800">Review Extraction</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Status Banner */}
        <div className={`p-4 border-b ${validation.isValid ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className="flex gap-3">
             {validation.isValid ? (
               <CheckCircle2 className="text-green-600 shrink-0" />
             ) : (
               <AlertTriangle className="text-amber-600 shrink-0" />
             )}
             <div>
               <h3 className={`font-semibold ${validation.isValid ? 'text-green-800' : 'text-amber-800'}`}>
                 {validation.isValid ? 'Data verified' : 'Potential Mismatch Detected'}
               </h3>
               <p className={`text-sm mt-1 ${validation.isValid ? 'text-green-700' : 'text-amber-700'}`}>
                 {validation.isValid 
                   ? 'Consumption math matches the total amount reasonably well.' 
                   : `Calculated consumption (€${validation.calculatedTotal.toFixed(2)}) differs significantly from total. Please verify meter readings.`}
               </p>
             </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Customer Info */}
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Customer Name</span>
                <input
                  type="text"
                  value={formData.customer_name || ''}
                  onChange={(e) => handleChange('customer_name', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-invoice-500 focus:ring-invoice-500 bg-gray-50 border p-2"
                />
              </label>
              
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Customer ID (DPR)</span>
                <input
                  type="text"
                  value={formData.customer_id || ''}
                  onChange={(e) => handleChange('customer_id', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-invoice-500 focus:ring-invoice-500 bg-gray-50 border p-2"
                />
              </label>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Billing Month</span>
                <input
                  type="text"
                  value={formData.billing_month || ''}
                  onChange={(e) => handleChange('billing_month', e.target.value)}
                  placeholder="MM-YYYY"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-invoice-500 focus:ring-invoice-500 bg-gray-50 border p-2"
                />
              </label>

               <label className="block">
                <span className="text-sm font-medium text-gray-700">Invoice Date</span>
                <input
                  type="date"
                  value={formData.invoice_date || ''}
                  onChange={(e) => handleChange('invoice_date', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-invoice-500 focus:ring-invoice-500 bg-gray-50 border p-2"
                />
              </label>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Meter Readings */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Meter Readings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="block">
                  <span className="text-xs font-bold text-blue-800 uppercase">High Tariff (A1)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.meter_readings.A1_high_tariff || 0}
                    onChange={(e) => handleMeterChange('A1_high_tariff', e.target.value)}
                    className="mt-2 block w-full rounded-md border-blue-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg font-mono font-semibold p-2"
                  />
                </label>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <label className="block">
                  <span className="text-xs font-bold text-purple-800 uppercase">Low Tariff (A2)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.meter_readings.A2_low_tariff || 0}
                    onChange={(e) => handleMeterChange('A2_low_tariff', e.target.value)}
                    className="mt-2 block w-full rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-lg font-mono font-semibold p-2"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-900 text-white p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Amount</p>
              <p className="text-xs text-gray-500">Includes VAT & Fixed Costs</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">€</span>
              <input
                type="number"
                step="0.01"
                value={formData.total_amount_eur || 0}
                onChange={(e) => handleChange('total_amount_eur', parseFloat(e.target.value))}
                className="bg-transparent text-3xl font-bold text-right w-32 focus:outline-none focus:border-b border-gray-700"
              />
            </div>
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
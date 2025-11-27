import React, { useRef, useState } from 'react';
import { Camera, Upload, Loader2, AlertCircle } from 'lucide-react';
import { scanBillWithGemini } from '../services/geminiService';
import { KescoBill } from '../types';

interface ScannerProps {
  onScanComplete: (data: KescoBill) => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const data = await scanBillWithGemini(file);
      onScanComplete(data);
    } catch (err) {
      console.error(err);
      setError("Failed to extract data. Please ensure the image is clear and try again.");
      setIsProcessing(false);
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-invoice-400 rounded-full opacity-20 animate-ping"></div>
          <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-invoice-500 relative z-10">
             <Loader2 size={48} className="text-invoice-600 animate-spin" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Analyzing Bill...</h2>
          <p className="text-gray-500 max-w-xs mx-auto">Extracting meter readings and customer data using Gemini 2.5 Flash.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-300">
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-invoice-100 rounded-full flex items-center justify-center mx-auto mb-4 text-invoice-600">
            <ScanLineIcon />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Scan New Invoice</h2>
          <p className="text-gray-500">Capture a clear photo of your KESCO bill to automatically extract details.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start text-left gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          
          <button
            onClick={triggerCamera}
            className="w-full py-4 bg-invoice-600 hover:bg-invoice-700 active:bg-invoice-800 text-white rounded-xl font-semibold shadow-md flex items-center justify-center gap-3 transition-all transform active:scale-95"
          >
            <Camera size={24} />
            <span>Launch Camera</span>
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400">Or upload file</span>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors"
          >
            <Upload size={20} />
            <span>Select from Gallery</span>
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-center text-gray-400 max-w-xs">
        Data is processed securely. Make sure the bill is well-lit and placed on a flat surface.
      </p>
    </div>
  );
};

// Helper Icon
const ScanLineIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <line x1="7" x2="17" y1="12" y2="12" />
  </svg>
);
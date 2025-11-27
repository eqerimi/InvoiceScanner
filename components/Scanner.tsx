
import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Loader2, AlertCircle, X, SwitchCamera } from 'lucide-react';
import { scanInvoiceWithGemini } from '../services/geminiService';
import { Invoice } from '../types';

interface ScannerProps {
  onScanComplete: (data: Invoice) => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Fix: Attach stream to video element when the Camera UI mounts
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const data = await scanInvoiceWithGemini(file);
      onScanComplete(data);
    } catch (err) {
      console.error(err);
      setError("Failed to extract data. Please ensure the image is clear and try again.");
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 } 
        } 
      });
      
      streamRef.current = stream;
      // Note: We don't assign videoRef.srcObject here because videoRef is null 
      // until the state update triggers a re-render. The useEffect above handles it.
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      // Fallback to native file input if getUserMedia fails (e.g. no permissions or unsupported)
      fileInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          stopCamera();
          processFile(file);
        }
      }, 'image/jpeg', 0.9);
    }
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Analyzing Invoice...</h2>
          <p className="text-gray-500 max-w-xs mx-auto">Extracting vendor, amounts, and payment details using Gemini 2.5 Flash.</p>
        </div>
      </div>
    );
  }

  // Live Camera UI
  if (isCameraActive) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             className="absolute w-full h-full object-cover"
           />
           
           {/* Guidelines Overlay */}
           <div className="absolute inset-0 border-2 border-white/30 m-8 rounded-lg pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-invoice-500 -mt-1 -ml-1"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-invoice-500 -mt-1 -mr-1"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-invoice-500 -mb-1 -ml-1"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-invoice-500 -mb-1 -mr-1"></div>
           </div>

           {/* Close Button */}
           <button 
             onClick={stopCamera}
             className="absolute top-6 right-6 p-3 bg-black/40 text-white rounded-full backdrop-blur-sm z-20 hover:bg-black/60 transition-colors"
           >
             <X size={24} />
           </button>
        </div>

        {/* Camera Controls */}
        <div className="h-32 bg-black flex items-center justify-center gap-8 pb-8 pt-4">
           <button 
             onClick={stopCamera}
             className="p-4 rounded-full text-white/80 hover:bg-white/10 transition-colors"
           >
             <X size={24} />
           </button>
           
           <button 
             onClick={capturePhoto}
             className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
             aria-label="Take Photo"
           >
             <div className="w-16 h-16 bg-white rounded-full"></div>
           </button>

           <div className="w-14"></div> {/* Spacer for balance */}
        </div>
      </div>
    );
  }

  // Default Menu UI
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-300">
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-invoice-100 rounded-full flex items-center justify-center mx-auto mb-4 text-invoice-600">
            <ScanLineIcon />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Scan New Invoice</h2>
          <p className="text-gray-500">Capture a clear photo of any invoice to automatically extract accounting data.</p>
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
            onClick={startCamera}
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
        Data is processed securely. Works best with good lighting and clear text.
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

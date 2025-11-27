import React from 'react';
import { AppView } from '../types';
import { LayoutDashboard, ScanLine, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => onChangeView(AppView.DASHBOARD)}
          >
            <div className="w-8 h-8 bg-invoice-500 rounded-lg flex items-center justify-center text-white font-bold">
              I
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">InvoiceScanner</h1>
          </div>
          
          <nav className="flex items-center gap-2">
            <button 
              onClick={() => onChangeView(AppView.DASHBOARD)}
              className={`p-2 rounded-md transition-colors ${currentView === AppView.DASHBOARD ? 'bg-invoice-100 text-invoice-700' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label="Dashboard"
            >
              <LayoutDashboard size={20} />
            </button>
            <button 
              onClick={() => onChangeView(AppView.SCAN)}
              className={`p-2 rounded-md transition-colors ${currentView === AppView.SCAN ? 'bg-invoice-100 text-invoice-700' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label="Scan"
            >
              <ScanLine size={20} />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-gray-400">
          <p>© 2025 InvoiceScanner v1.1. Powered by Gemini 2.5 Flash.</p>
        </div>
      </footer>
    </div>
  );
};
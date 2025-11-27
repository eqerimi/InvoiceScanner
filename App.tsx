import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Scanner } from './components/Scanner';
import { ReviewForm } from './components/ReviewForm';
import { Dashboard } from './components/Dashboard';
import { AppView, Invoice } from './types';

const STORAGE_KEY = 'invoicescanner_data_v2'; // Bump version for new schema

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.SCAN);
  const [scannedData, setScannedData] = useState<Invoice | null>(null);
  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedInvoices(parsed);
        // If we have data, start at dashboard, else start at scan
        if (parsed.length > 0) {
            setCurrentView(AppView.DASHBOARD);
        }
      } catch (e) {
        console.error("Failed to load local storage", e);
      }
    }
  }, []);

  const handleScanComplete = (data: Invoice) => {
    setScannedData(data);
    setCurrentView(AppView.REVIEW);
  };

  const handleSaveInvoice = (data: Invoice) => {
    const newInvoice = {
      ...data,
      id: crypto.randomUUID(),
      scanned_at: new Date().toISOString()
    };
    
    const updatedInvoices = [newInvoice, ...savedInvoices];
    setSavedInvoices(updatedInvoices);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedInvoices));
    
    setScannedData(null);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleCancelReview = () => {
    setScannedData(null);
    setCurrentView(AppView.SCAN);
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {currentView === AppView.SCAN && (
        <Scanner onScanComplete={handleScanComplete} />
      )}
      
      {currentView === AppView.REVIEW && scannedData && (
        <ReviewForm 
          initialData={scannedData} 
          onSave={handleSaveInvoice} 
          onCancel={handleCancelReview}
        />
      )}
      
      {currentView === AppView.DASHBOARD && (
        <Dashboard invoices={savedInvoices} />
      )}
    </Layout>
  );
}
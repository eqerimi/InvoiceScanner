import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Scanner } from './components/Scanner';
import { ReviewForm } from './components/ReviewForm';
import { Dashboard } from './components/Dashboard';
import { AppView, KescoBill } from './types';

const STORAGE_KEY = 'invoicescanner_data_v1';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.SCAN);
  const [scannedData, setScannedData] = useState<KescoBill | null>(null);
  const [savedBills, setSavedBills] = useState<KescoBill[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedBills(JSON.parse(stored));
        // If we have data, start at dashboard, else start at scan
        if (JSON.parse(stored).length > 0) {
            setCurrentView(AppView.DASHBOARD);
        }
      } catch (e) {
        console.error("Failed to load local storage", e);
      }
    }
  }, []);

  const handleScanComplete = (data: KescoBill) => {
    setScannedData(data);
    setCurrentView(AppView.REVIEW);
  };

  const handleSaveBill = (data: KescoBill) => {
    const newBill = {
      ...data,
      id: crypto.randomUUID(),
      scanned_at: new Date().toISOString()
    };
    
    const updatedBills = [newBill, ...savedBills];
    setSavedBills(updatedBills);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBills));
    
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
          onSave={handleSaveBill} 
          onCancel={handleCancelReview}
        />
      )}
      
      {currentView === AppView.DASHBOARD && (
        <Dashboard bills={savedBills} />
      )}
    </Layout>
  );
}

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import App from '../App';
import * as geminiService from '../services/geminiService';
import { Invoice } from '../types';

// Mock the Gemini Service
vi.mock('../services/geminiService');

const mockInvoice: Invoice = {
  vendor_name: 'Tech Corp',
  invoice_number: 'INV-001',
  invoice_date: '2025-01-01',
  due_date: '2025-01-15',
  currency: 'EUR',
  total_amount: 120.00,
  tax_amount: 20.00,
  net_amount: 100.00,
  iban: 'XK050000',
  scanned_at: '2025-01-01T12:00:00Z'
};

describe('Architecture: Feature Workflow & Routing', () => {
  
  beforeAll(() => {
    // Setup Global Mocks for Browser APIs not present in JSDOM

    // 1. Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    // 2. Mock srcObject on HTMLMediaElement (Video tag)
    Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
      configurable: true,
      get() { return this._srcObject; },
      set(v) { this._srcObject = v; }
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('Phase A: Launch Camera button should start live camera UI (Success Path)', async () => {
    // Mock successful camera stream
    const mockStream = {
      getTracks: () => [{ stop: vi.fn() }],
      active: true
    };
    (window.navigator.mediaDevices.getUserMedia as any).mockResolvedValue(mockStream);

    render(<App />);

    // 1. Click Launch Camera
    const launchBtn = screen.getByRole('button', { name: /launch camera/i });
    fireEvent.click(launchBtn);

    // 2. Verify getUserMedia was requested
    await waitFor(() => {
      expect(window.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: expect.objectContaining({ facingMode: 'environment' })
      });
    });

    // 3. Verify UI switched to Live View (Look for the Shutter Button or Close Button)
    // The shutter button has aria-label "Take Photo"
    expect(screen.getByLabelText(/take photo/i)).toBeInTheDocument();
  });

  it('Phase A: Launch Camera should fallback to file input if camera fails (Fallback Path)', async () => {
    // Mock camera permission denied
    (window.navigator.mediaDevices.getUserMedia as any).mockRejectedValue(new Error('Permission Denied'));

    render(<App />);

    // 1. Spy on the hidden file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    // 2. Click Launch Camera
    const launchBtn = screen.getByRole('button', { name: /launch camera/i });
    fireEvent.click(launchBtn);

    // 3. Verify Fallback triggered
    await waitFor(() => {
      expect(window.navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  it('Phase A: Select from Gallery should directly open file input', () => {
    render(<App />);
    
    // 1. Spy on the hidden file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    // 2. Click "Select from Gallery"
    const galleryBtn = screen.getByRole('button', { name: /select from gallery/i });
    fireEvent.click(galleryBtn);

    // 3. Verify direct click (no getUserMedia call)
    expect(clickSpy).toHaveBeenCalled();
    expect(window.navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });

  it('Phase B & C: Full Extraction to Review Workflow', async () => {
    // Setup Mock
    (geminiService.scanInvoiceWithGemini as any).mockResolvedValue(mockInvoice);

    render(<App />);

    // Trigger Scan via file input change event (simulation of taking a photo or selecting file)
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // React's onChange needs a proper event structure
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    fireEvent.change(fileInput);

    // Should show loading state
    expect(screen.getByText('Analyzing Invoice...')).toBeInTheDocument();

    // Wait for Review Form (Navigation to REVIEW view)
    await waitFor(() => {
      expect(screen.getByText('Review Invoice')).toBeInTheDocument();
    });

    // Verify Data Population
    expect(screen.getByDisplayValue('Tech Corp')).toBeInTheDocument();
    expect(screen.getByDisplayValue('120')).toBeInTheDocument();

    // Verify Validation Logic (Net + Tax = Total)
    // 100 + 20 = 120. Should show 'Math Verified'
    expect(screen.getByText('Math Verified')).toBeInTheDocument();
  });

  it('Phase C (Validation): Should detect Math Mismatch', async () => {
    // Invoice where 100 + 20 != 500
    const badInvoice = { ...mockInvoice, total_amount: 500 };
    (geminiService.scanInvoiceWithGemini as any).mockResolvedValue(badInvoice);

    render(<App />);
    
    // Trigger Scan
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File([], 't.jpg')] } });

    await waitFor(() => screen.getByText('Review Invoice'));

    // Should show Warning
    expect(screen.getByText('Amount Mismatch')).toBeInTheDocument();
  });

  it('Phase D: Dashboard & Persistence', async () => {
    // Pre-seed local storage to test Dashboard load
    const savedInvoices = [{ ...mockInvoice, id: '123' }];
    localStorage.setItem('invoicescanner_data_v2', JSON.stringify(savedInvoices));

    render(<App />);

    // Should start at Dashboard
    expect(screen.getByText('Recent Invoices')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    
    // Verify Analytics
    expect(screen.getByText('€120.00')).toBeInTheDocument(); // Total Value
  });
});

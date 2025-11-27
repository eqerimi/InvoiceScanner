export interface Invoice {
  id?: string; // Internal ID
  vendor_name: string;
  invoice_number: string;
  invoice_date: string; // YYYY-MM-DD
  due_date: string | null; // YYYY-MM-DD
  currency: string;
  total_amount: number;
  tax_amount: number;
  net_amount: number; // Subtotal
  iban: string | null; // Payment info
  scanned_at?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SCAN = 'SCAN',
  REVIEW = 'REVIEW',
}

export interface ValidationResult {
  isValid: boolean;
  calculatedTotal: number;
  diffPercent: number;
}
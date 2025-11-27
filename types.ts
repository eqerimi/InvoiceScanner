export interface MeterReading {
  A1_high_tariff: number;
  A2_low_tariff: number;
}

export interface KescoBill {
  id?: string; // Internal ID for local storage
  customer_id: string; // DPR number
  customer_name: string;
  billing_month: string; // MM-YYYY
  meter_readings: MeterReading;
  total_amount_eur: number;
  invoice_date: string; // ISO 8601
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

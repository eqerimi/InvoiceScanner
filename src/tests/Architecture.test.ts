
import { describe, it, expect } from 'vitest';
import manifest from '../../manifest.json';

describe('Architecture: Deployment & Build Environment', () => {
  it('manifest.json should be configured for PWA Standalone mode', () => {
    // Verifies Section 2: Manifest configuration
    expect(manifest.name).toBe('InvoiceScanner');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  it('Environment Variables should be accessible', () => {
    // Verifies Section 1: vite.config.ts logic
    // We verify that the application code can access the API Key variable
    const key = process.env.API_KEY;
    expect(key).toBeDefined(); 
  });
});

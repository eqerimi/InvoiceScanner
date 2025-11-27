
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Set dummy API Key for tests
process.env.API_KEY = 'test-api-key';

// Mock IntersectionObserver which is not available in JSDOM
class IntersectionObserver {
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

// Mock URL.createObjectURL for CSV download test
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(),
});


import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { scanInvoiceWithGemini } from './geminiService';

// Mock GoogleGenAI SDK
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent
      }
    })),
    Type: { OBJECT: 'OBJECT', STRING: 'STRING', NUMBER: 'NUMBER' }
  };
});

describe('Gemini Service', () => {
  const originalFileReader = globalThis.FileReader;
  const originalImage = globalThis.Image;

  beforeAll(() => {
    // 1. Mock FileReader to simulate file reading
    class MockFileReader {
      onload: any;
      onerror: any;
      readAsDataURL() {
        setTimeout(() => {
            if (this.onload) {
                this.onload({ target: { result: 'data:image/jpeg;base64,mock-source-data' } });
            }
        }, 0);
      }
    }
    globalThis.FileReader = MockFileReader as any;

    // 2. Mock Image to simulate image loading
    class MockImage {
      onload: any;
      onerror: any;
      width = 100;
      height = 100;
      set src(_: string) {
        setTimeout(() => {
            if (this.onload) this.onload();
        }, 0);
      }
    }
    globalThis.Image = MockImage as any;

    // 3. Mock Canvas to simulate drawing and data extraction
    // JSDOM usually handles createElement('canvas'), but we need to ensure toDataURL works
    if (!HTMLCanvasElement.prototype.toDataURL) {
        HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,resized-base64-data';
    } else {
        vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,resized-base64-data');
    }
    
    if (!HTMLCanvasElement.prototype.getContext) {
        HTMLCanvasElement.prototype.getContext = () => ({
            drawImage: vi.fn(),
        }) as any;
    } else {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
             drawImage: vi.fn(),
        } as any);
    }
  });

  afterAll(() => {
    globalThis.FileReader = originalFileReader;
    globalThis.Image = originalImage;
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should construct the correct API request', async () => {
    // Mock successful response
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        vendor_name: 'Test Vendor',
        total_amount: 100,
        invoice_number: '123'
      })
    });

    const file = new File([''], 'test.png', { type: 'image/png' });
    
    await scanInvoiceWithGemini(file);

    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-2.5-flash',
      config: expect.objectContaining({
        responseMimeType: 'application/json',
        temperature: 0.1
      })
    }));
  });

  it('should handle API errors gracefully', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API Error'));
    const file = new File([''], 'test.png', { type: 'image/png' });

    await expect(scanInvoiceWithGemini(file)).rejects.toThrow('API Error');
  });
});

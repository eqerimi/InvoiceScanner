import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Invoice } from "../types";

// Initialize the Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert Accounts Payable AI assistant. 
Your goal is to extract structured data from invoices for accounting and payment purposes.
- Identify the Vendor Name accurately.
- Extract the Invoice Number (often labeled Inv No, Invoice #, Fatura, etc.).
- Extract dates: Invoice Date and Due Date. If Due Date is not explicit, leave null.
- Extract financial amounts: Total Amount (payable), Tax Amount (VAT/GST), and Net Amount (Subtotal).
- Extract Payment Information: Look for IBAN, Bank Account Number, or SWIFT.
- Determine the Currency symbol/code (EUR, USD, GBP, etc.).
- Do not make up data. If a field is missing, return null or empty string.
`;

const INVOICE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    vendor_name: { type: Type.STRING, description: "Name of the supplier or service provider" },
    invoice_number: { type: Type.STRING, description: "Unique identifier for the invoice" },
    invoice_date: { type: Type.STRING, description: "YYYY-MM-DD format" },
    due_date: { type: Type.STRING, description: "YYYY-MM-DD format", nullable: true },
    currency: { type: Type.STRING, description: "ISO Currency Code e.g. EUR, USD" },
    total_amount: { type: Type.NUMBER, description: "Final payable amount including tax" },
    tax_amount: { type: Type.NUMBER, description: "Total tax/VAT amount" },
    net_amount: { type: Type.NUMBER, description: "Total amount before tax (Subtotal)" },
    iban: { type: Type.STRING, description: "International Bank Account Number for payment", nullable: true },
  },
  required: ["vendor_name", "invoice_number", "invoice_date", "total_amount", "currency"],
};

/**
 * Resizes an image to a maximum dimension to optimize for API payload size.
 */
const resizeImage = (file: File, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Return base64 string without the prefix for the API
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const scanInvoiceWithGemini = async (file: File): Promise<Invoice> => {
  try {
    const base64Image = await resizeImage(file);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Extract data from this invoice for accounting."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: INVOICE_SCHEMA,
        temperature: 0.1, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini");

    const data = JSON.parse(text) as Invoice;
    // Normalize nulls if necessary
    return {
      ...data,
      due_date: data.due_date || null,
      iban: data.iban || null,
      tax_amount: data.tax_amount || 0,
      net_amount: data.net_amount || 0
    };

  } catch (error) {
    console.error("Extraction failed:", error);
    throw error;
  }
};
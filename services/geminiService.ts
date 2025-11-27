import { GoogleGenAI, Type, Schema } from "@google/genai";
import { KescoBill } from "../types";

// Initialize the Gemini Client
// Note: process.env.API_KEY is guaranteed to be available in this environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a specialized data extraction engine for KESCO Energy bills.
Your ONLY purpose is to extract fields exactly according to the provided JSON schema.
Look for "DPR" to find the Customer ID.
"Totali" or "Shuma" usually indicates the final amount.
A1 and A2 are distinct meter readings; do not confuse them.
If a field is illegible, return null, do not hallucinate data.
`;

const BILL_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    customer_id: { type: Type.STRING, description: "The DPR number, e.g., 'DPR 90050061'" },
    customer_name: { type: Type.STRING },
    billing_month: { type: Type.STRING, description: "Format MM-YYYY" },
    meter_readings: {
      type: Type.OBJECT,
      properties: {
        A1_high_tariff: { type: Type.NUMBER },
        A2_low_tariff: { type: Type.NUMBER },
      },
      required: ["A1_high_tariff", "A2_low_tariff"],
    },
    total_amount_eur: { type: Type.NUMBER },
    invoice_date: { type: Type.STRING, description: "ISO 8601 Date" },
  },
  required: ["customer_id", "customer_name", "billing_month", "meter_readings", "total_amount_eur", "invoice_date"],
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

export const scanBillWithGemini = async (file: File): Promise<KescoBill> => {
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
            text: "Extract data from this KESCO invoice."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: BILL_SCHEMA,
        temperature: 0.1, // Deterministic as per PRD
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini");

    const data = JSON.parse(text) as KescoBill;
    return data;

  } catch (error) {
    console.error("Extraction failed:", error);
    throw error;
  }
};

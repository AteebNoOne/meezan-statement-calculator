import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Statement Parser endpoint (works on both scanned images and PDF files)
  app.post('/api/parse-statement', async (req, res) => {
    try {
      const { fileBase64, mimeType } = req.body;

      if (!fileBase64 || !mimeType) {
        return res.status(400).json({ error: 'fileBase64 and mimeType are required.' });
      }

      const ai = getGeminiClient();

      const prompt = `You are a financial document parser specialized in Meezan Bank Account Statements.
Analyze the provided document (Meezan Bank Account Statement page/document).
Carefully extract each transaction row from the statement table.

Notice these specific rules for Meezan Bank statements:
1. "Credit" column: Has a '+' sign, written in GREEN color (e.g. '+ PKR1,000.00', '+ PKR3,000.00'). This represents money deposited or received. Return its positive numeric amount in the "credit" field.
2. "Debit" column: Has a '-' sign, written in RED color (e.g. '- PKR5,459.00', '- PKR3,900.00'). This represents money withdrawn, spent, or deducted. Return its positive numeric amount in the "debit" field.
3. Every row has either a credit OR a debit (not both).
4. Extract the exact Booking Date (e.g. '21 Jan 2026').
5. Extract the Description (e.g. 'Raast P2P Fund transfer - from AMNA WAJID...', 'CHASE UP POS Transaction STAN (759518)').
6. Extract the Available Balance (e.g. 11179.55).

Return all rows found in the document accurately.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: fileBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bankName: { type: Type.STRING },
              accountTitle: { type: Type.STRING },
              accountNumber: { type: Type.STRING },
              currency: { type: Type.STRING },
              entries: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    bookingDate: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: {
                      type: Type.STRING,
                      enum: ['credit', 'debit'],
                    },
                    amount: { type: Type.NUMBER },
                    credit: { type: Type.NUMBER, nullable: true },
                    debit: { type: Type.NUMBER, nullable: true },
                    availableBalance: { type: Type.NUMBER, nullable: true },
                  },
                  required: ['bookingDate', 'description', 'type', 'amount'],
                },
              },
            },
            required: ['entries'],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      return res.json(parsedData);
    } catch (error: any) {
      console.error('Error parsing statement:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to parse statement with AI.',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import * as pdfjsLib from 'pdfjs-dist';
import { StatementEntry, StatementSummary, ParsedStatementResult } from '../types';
import { calculateSummary } from '../data/sampleStatement';

// Set up worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
} catch (err) {
  console.warn('Could not set external PDF worker, continuing with default worker:', err);
}

interface RawTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extracts transactions directly from a digital PDF using coordinate and regex analysis.
 */
export async function parseMeezanPdf(file: File, pinToken?: string): Promise<ParsedStatementResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const allEntries: StatementEntry[] = [];
  let totalTextItemsCount = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    totalTextItemsCount += textContent.items.length;

    const textItems: RawTextItem[] = textContent.items
      .filter((item: any) => item && typeof item.str === 'string')
      .map((item: any) => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width || 0,
        height: item.height || 0,
      }));

    const pageEntries = extractEntriesFromTextItems(textItems, pageNum);
    allEntries.push(...pageEntries);
  }

  // If digital text extraction didn't yield transactions, check if AI is authorized
  if (allEntries.length === 0) {
    if (pinToken) {
      return parseViaAiServer(file, pinToken);
    }
    throw new Error(
      'No digital text transactions found in this document. If this is a scanned document or camera photo, please enable "Use AI OCR" (requires security PIN).'
    );
  }

  return {
    fileName: file.name,
    pageCount: numPages,
    bankName: 'Meezan Bank',
    entries: allEntries,
    summary: calculateSummary(allEntries),
    parsedAt: new Date().toISOString(),
  };
}

/**
 * Parse text items on a page into Meezan Bank transactions.
 */
function extractEntriesFromTextItems(items: RawTextItem[], pageNum: number): StatementEntry[] {
  // Group items by Y coordinate with a 5px tolerance
  const sortedByY = [...items].sort((a, b) => b.y - a.y);
  const rows: { y: number; items: RawTextItem[] }[] = [];

  for (const item of sortedByY) {
    let row = rows.find((r) => Math.abs(r.y - item.y) <= 6);
    if (!row) {
      row = { y: item.y, items: [] };
      rows.push(row);
    }
    row.items.push(item);
  }

  // Sort each row items by X (left to right)
  for (const row of rows) {
    row.items.sort((a, b) => a.x - b.x);
  }

  // Combine row items to inspect full line text
  const fullRows = rows.map((row) => ({
    y: row.y,
    rawItems: row.items,
    fullText: row.items.map((i) => i.str).join(' '),
  }));

  const entries: StatementEntry[] = [];
  const dateRegex = /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i;
  const creditRegex = /\+\s*(?:PKR|Rs\.?)?\s*([\d,]+\.?\d*)/i;
  const debitRegex = /-\s*(?:PKR|Rs\.?)?\s*([\d,]+\.?\d*)/i;

  let currentEntry: Partial<StatementEntry> | null = null;
  let descriptionLines: string[] = [];

  for (let i = 0; i < fullRows.length; i++) {
    const row = fullRows[i];
    const text = row.fullText;

    // Skip headers and page footer
    if (
      /Booking Date/i.test(text) &&
      /Description/i.test(text) &&
      (/Credit/i.test(text) || /Debit/i.test(text))
    ) {
      continue;
    }
    if (/Meezan Bank/i.test(text) && /Account Statement/i.test(text)) {
      continue;
    }
    if (/Available Balance/i.test(text)) {
      continue;
    }

    const dateMatch = text.match(dateRegex);
    const creditMatch = text.match(creditRegex);
    const debitMatch = text.match(debitRegex);

    // Check if this row has an amount (+ for credit or - for debit)
    if (creditMatch || debitMatch) {
      // If we had a previous entry, commit it
      if (currentEntry && currentEntry.type && currentEntry.amount) {
        currentEntry.description = descriptionLines.join(' ').trim();
        entries.push(currentEntry as StatementEntry);
        descriptionLines = [];
      }

      const dateStr: string = dateMatch ? dateMatch[1] : (currentEntry?.bookingDate || 'Unknown Date');
      let type: 'credit' | 'debit' = creditMatch ? 'credit' : 'debit';
      let rawAmountStr = creditMatch ? creditMatch[1] : debitMatch![1];
      const amount = parseFloat(rawAmountStr.replace(/,/g, '')) || 0;

      // Check balance (usually PKR xx,xxx.xx or digits at the rightmost edge)
      let availableBalance: number | null = null;
      const balanceMatch = text.match(/(?:PKR|Rs\.?)?\s*([\d,]+\.\d{2})\s*$/i);
      if (balanceMatch) {
        const bal = parseFloat(balanceMatch[1].replace(/,/g, ''));
        if (!isNaN(bal) && bal !== amount) {
          availableBalance = bal;
        }
      }

      // Filter out date, amount and balance strings from description
      let descText = text;
      if (dateMatch) {
        descText = descText.replace(dateMatch[0], '');
      }
      if (creditMatch) {
        descText = descText.replace(creditMatch[0], '');
      }
      if (debitMatch) {
        descText = descText.replace(debitMatch[0], '');
      }
      if (balanceMatch) {
        descText = descText.replace(balanceMatch[0], '');
      }
      descText = descText.replace(/PKR/gi, '').trim();

      descriptionLines = descText ? [descText] : [];

      currentEntry = {
        id: `entry-${pageNum}-${i}-${Date.now()}`,
        bookingDate: dateStr,
        type,
        amount,
        credit: type === 'credit' ? amount : null,
        debit: type === 'debit' ? amount : null,
        availableBalance,
        pageNumber: pageNum,
      };
    } else if (currentEntry) {
      // Continuation line for description (e.g. multi-line STAN / party details)
      // Make sure it's not a footer or page number like "26 19 Sep 2026, 18:35"
      if (!/^\d+\s+\d{1,2}\s+[A-Za-z]+\s+\d{4}/.test(text) && !/^Page \d+/i.test(text)) {
        descriptionLines.push(text);
      }
    }
  }

  // Commit last entry if any
  if (currentEntry && currentEntry.type && currentEntry.amount) {
    currentEntry.description = descriptionLines.join(' ').trim();
    entries.push(currentEntry as StatementEntry);
  }

  return entries;
}

/**
 * Converts a File into base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Parse via backend AI service for scanned PDF or image statements
 */
export async function parseViaAiServer(file: File, pinToken?: string): Promise<ParsedStatementResult> {
  const base64 = await fileToBase64(file);
  const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (pinToken) {
    headers['X-AI-PIN-Token'] = pinToken;
  }

  const res = await fetch('/api/parse-statement', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fileBase64: base64,
      mimeType: mimeType,
      pinToken: pinToken,
    }),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        'AI OCR server endpoint (/api/parse-statement) returned 404 Not Found. Please ensure your backend server (server.ts / npm run dev / dist/server.cjs) is running and your web server reverse-proxy forwards /api/* requests to it.'
      );
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error('Unauthorized: Security PIN verification required to use AI OCR.');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server returned error ${res.status}`);
  }

  const data = await res.json();
  const rawEntries = data.entries || [];

  const formattedEntries: StatementEntry[] = rawEntries.map((e: any, idx: number) => {
    const type: 'credit' | 'debit' = e.type === 'credit' || (e.credit && e.credit > 0) ? 'credit' : 'debit';
    const amount = Number(e.amount || e.credit || e.debit || 0);

    return {
      id: `ai-entry-${idx}-${Date.now()}`,
      bookingDate: e.bookingDate || 'Unknown Date',
      description: e.description || '',
      type,
      amount,
      credit: type === 'credit' ? amount : null,
      debit: type === 'debit' ? amount : null,
      availableBalance: e.availableBalance ? Number(e.availableBalance) : null,
      pageNumber: 1,
    };
  });

  return {
    fileName: file.name,
    pageCount: 1,
    bankName: data.bankName || 'Meezan Bank',
    accountTitle: data.accountTitle,
    accountNumber: data.accountNumber,
    entries: formattedEntries,
    summary: calculateSummary(formattedEntries),
    parsedAt: new Date().toISOString(),
  };
}

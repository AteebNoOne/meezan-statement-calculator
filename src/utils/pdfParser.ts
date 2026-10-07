import * as pdfjsLib from 'pdfjs-dist';
import { StatementEntry, ParsedStatementResult, BankType } from '../types';
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

interface ExtractedMetadata {
  bankName: string;
  bankType?: BankType;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  cnic?: string;
  branch?: string;
  openingBalance?: number | null;
  closingBalance?: number | null;
  statementDuration?: string;
}

/**
 * Unified PDF statement parser routing to HBL or Meezan
 */
export async function parseStatementPdf(
  file: File,
  bankType: BankType = 'hbl',
  pinToken?: string
): Promise<ParsedStatementResult> {
  if (bankType === 'meezan') {
    return parseMeezanPdf(file, pinToken);
  }
  return parseHblPdf(file, pinToken);
}

/**
 * Extracts transactions directly from a digital HBL PDF using coordinate and regex analysis.
 */
export async function parseHblPdf(file: File, pinToken?: string): Promise<ParsedStatementResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const allEntries: StatementEntry[] = [];
  let metadata: ExtractedMetadata = {
    bankName: 'Habib Bank Limited (HBL)',
    bankType: 'hbl',
  };

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const textItems: RawTextItem[] = textContent.items
      .filter((item: any) => item && typeof item.str === 'string')
      .map((item: any) => ({
        str: item.str.trim(),
        x: item.transform[4],
        y: item.transform[5],
        width: item.width || 0,
        height: item.height || 0,
      }))
      .filter((item) => item.str.length > 0);

    if (pageNum === 1) {
      metadata = extractHblMetadataFromPage(textItems);
    }

    const pageEntries = extractHblEntriesFromTextItems(textItems, pageNum);
    allEntries.push(...pageEntries);
  }

  if (allEntries.length === 0) {
    if (pinToken) {
      return parseViaAiServer(file, 'hbl', pinToken);
    }
    throw new Error(
      'No digital text transactions found in this document. If this is a scanned document or camera photo, please enable "Use AI OCR" (requires security PIN).'
    );
  }

  return {
    fileName: file.name,
    pageCount: numPages,
    bankType: 'hbl',
    bankName: metadata.bankName || 'Habib Bank Limited (HBL)',
    accountTitle: metadata.accountTitle,
    accountNumber: metadata.accountNumber,
    iban: metadata.iban,
    cnic: metadata.cnic,
    branch: metadata.branch,
    openingBalance: metadata.openingBalance,
    closingBalance: metadata.closingBalance,
    statementDuration: metadata.statementDuration,
    entries: allEntries,
    summary: calculateSummary(allEntries),
    parsedAt: new Date().toISOString(),
  };
}

/**
 * Extracts transactions directly from a digital Meezan Bank PDF.
 */
export async function parseMeezanPdf(file: File, pinToken?: string): Promise<ParsedStatementResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const allEntries: StatementEntry[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const textItems: RawTextItem[] = textContent.items
      .filter((item: any) => item && typeof item.str === 'string')
      .map((item: any) => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width || 0,
        height: item.height || 0,
      }));

    const pageEntries = extractMeezanEntriesFromTextItems(textItems, pageNum);
    allEntries.push(...pageEntries);
  }

  if (allEntries.length === 0) {
    if (pinToken) {
      return parseViaAiServer(file, 'meezan', pinToken);
    }
    throw new Error(
      'No digital text transactions found in this document. If this is a scanned document or camera photo, please enable "Use AI OCR" (requires security PIN).'
    );
  }

  return {
    fileName: file.name,
    pageCount: numPages,
    bankType: 'meezan',
    bankName: 'Meezan Bank (The Premier Islamic Bank)',
    entries: allEntries,
    summary: calculateSummary(allEntries),
    parsedAt: new Date().toISOString(),
  };
}

/**
 * Extract HBL Metadata from Page 1
 */
function extractHblMetadataFromPage(items: RawTextItem[]): ExtractedMetadata {
  const meta: ExtractedMetadata = {
    bankName: 'Habib Bank Limited (HBL)',
    bankType: 'hbl',
  };

  const fullText = items.map((i) => i.str).join(' ');

  const titleMatch = fullText.match(/Account Title:\s*([^Address|IBAN|Branch]+?)(?=Address:|IBAN:|Branch:|$)/i);
  if (titleMatch) meta.accountTitle = titleMatch[1].trim();

  const branchMatch = fullText.match(/Branch:\s*([^Account|Address|IBAN]+?)(?=Account Title:|Address:|IBAN:|$)/i);
  if (branchMatch) meta.branch = branchMatch[1].trim();

  const ibanMatch = fullText.match(/\b(PK\d{2}[A-Z]{4}\d{16})\b/i);
  if (ibanMatch) meta.iban = ibanMatch[1];

  const durationMatch = fullText.match(/Statement Duration:\s*([^Account|CNIC]+?)(?=Account Number:|CNIC Number:|$)/i);
  if (durationMatch) meta.statementDuration = durationMatch[1].trim();

  const accNumMatch = fullText.match(/\b(0400\d{10}|\d{14})\b/);
  if (accNumMatch) meta.accountNumber = accNumMatch[1];

  const cnicMatch = fullText.match(/\b(\d{13}|\d{5}-\d{7}-\d)\b/);
  if (cnicMatch) meta.cnic = cnicMatch[1];

  const openBalMatch = fullText.match(/Opening Balance\s*(?:Closing Balance)?\s*([\d,]+\.\d{2})/i);
  if (openBalMatch) meta.openingBalance = parseFloat(openBalMatch[1].replace(/,/g, ''));

  const closeBalMatch = fullText.match(/Closing Balance\s*([\d,]+\.\d{2})/i);
  if (closeBalMatch) meta.closingBalance = parseFloat(closeBalMatch[1].replace(/,/g, ''));

  return meta;
}

/**
 * Parse text items on a page into HBL Bank transactions.
 */
function extractHblEntriesFromTextItems(items: RawTextItem[], pageNum: number): StatementEntry[] {
  let debitColX = 0;
  let creditColX = 0;

  for (const item of items) {
    if (/^Debit$/i.test(item.str)) debitColX = item.x;
    if (/^Credit$/i.test(item.str)) creditColX = item.x;
  }

  const sortedByY = [...items].sort((a, b) => b.y - a.y);
  const rows: { y: number; items: RawTextItem[] }[] = [];

  for (const item of sortedByY) {
    let row = rows.find((r) => Math.abs(r.y - item.y) <= 5);
    if (!row) {
      row = { y: item.y, items: [] };
      rows.push(row);
    }
    row.items.push(item);
  }

  for (const row of rows) {
    row.items.sort((a, b) => a.x - b.x);
  }

  const entries: StatementEntry[] = [];
  const dateRegex = /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/;
  const amountRegex = /^[\d,]+\.\d{2}$/;

  let currentEntry: Partial<StatementEntry> | null = null;
  let descriptionLines: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowItems = row.items;
    const fullText = rowItems.map((it) => it.str).join(' ');

    if (
      /Transaction\s*Date/i.test(fullText) ||
      /Value\s*Date/i.test(fullText) ||
      /Account Activity generated/i.test(fullText) ||
      /Statement Duration/i.test(fullText) ||
      /Opening Balance/i.test(fullText) ||
      /Branch:/i.test(fullText) ||
      /Account Title:/i.test(fullText)
    ) {
      continue;
    }

    const firstStr = rowItems[0]?.str || '';
    const secondStr = rowItems[1]?.str || '';

    const hasStartDate = dateRegex.test(firstStr);
    const hasSecondDate = dateRegex.test(secondStr);

    if (hasStartDate) {
      if (currentEntry && currentEntry.type && currentEntry.amount) {
        currentEntry.description = descriptionLines.join(' ').trim();
        entries.push(currentEntry as StatementEntry);
        descriptionLines = [];
      }

      const txDate = firstStr;
      const valDate = hasSecondDate ? secondStr : txDate;
      const afterDatesItems = rowItems.slice(hasSecondDate ? 2 : 1);

      const numericItems = afterDatesItems.filter((it) => amountRegex.test(it.str.replace(/[^\d.,]/g, '')));
      const descItems = afterDatesItems.filter((it) => !amountRegex.test(it.str.replace(/[^\d.,]/g, '')));

      let type: 'credit' | 'debit' = 'debit';
      let amount = 0;
      let balance: number | null = null;

      if (numericItems.length >= 2) {
        const balanceStr = numericItems[numericItems.length - 1].str;
        balance = parseFloat(balanceStr.replace(/,/g, ''));

        const amtItem = numericItems[numericItems.length - 2];
        amount = parseFloat(amtItem.str.replace(/,/g, '')) || 0;

        if (creditColX > 0 && debitColX > 0) {
          const distToCredit = Math.abs(amtItem.x - creditColX);
          const distToDebit = Math.abs(amtItem.x - debitColX);
          type = distToCredit < distToDebit ? 'credit' : 'debit';
        } else {
          type = amtItem.x > 440 ? 'credit' : 'debit';
        }
      } else if (numericItems.length === 1) {
        const singleItem = numericItems[0];
        amount = parseFloat(singleItem.str.replace(/,/g, '')) || 0;
        type = creditColX > 0 && Math.abs(singleItem.x - creditColX) < 40 ? 'credit' : 'debit';
      }

      const descLine = descItems.map((it) => it.str).join(' ').trim();
      descriptionLines = descLine ? [descLine] : [];

      currentEntry = {
        id: `hbl-entry-${pageNum}-${i}-${Date.now()}`,
        bookingDate: txDate,
        valueDate: valDate,
        type,
        amount,
        credit: type === 'credit' ? amount : null,
        debit: type === 'debit' ? amount : null,
        availableBalance: balance,
        pageNumber: pageNum,
      };
    } else if (currentEntry) {
      if (!/^Page\s*\d+/i.test(fullText)) {
        descriptionLines.push(fullText);
      }
    }
  }

  if (currentEntry && currentEntry.type && currentEntry.amount) {
    currentEntry.description = descriptionLines.join(' ').trim();
    entries.push(currentEntry as StatementEntry);
  }

  return entries;
}

/**
 * Parse text items on a page into Meezan Bank transactions.
 */
function extractMeezanEntriesFromTextItems(items: RawTextItem[], pageNum: number): StatementEntry[] {
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

  for (const row of rows) {
    row.items.sort((a, b) => a.x - b.x);
  }

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

    if (creditMatch || debitMatch) {
      if (currentEntry && currentEntry.type && currentEntry.amount) {
        currentEntry.description = descriptionLines.join(' ').trim();
        entries.push(currentEntry as StatementEntry);
        descriptionLines = [];
      }

      const dateStr: string = dateMatch ? dateMatch[1] : (currentEntry?.bookingDate || 'Unknown Date');
      let type: 'credit' | 'debit' = creditMatch ? 'credit' : 'debit';
      let rawAmountStr = creditMatch ? creditMatch[1] : debitMatch![1];
      const amount = parseFloat(rawAmountStr.replace(/,/g, '')) || 0;

      let availableBalance: number | null = null;
      const balanceMatch = text.match(/(?:PKR|Rs\.?)?\s*([\d,]+\.\d{2})\s*$/i);
      if (balanceMatch) {
        const bal = parseFloat(balanceMatch[1].replace(/,/g, ''));
        if (!isNaN(bal) && bal !== amount) {
          availableBalance = bal;
        }
      }

      let descText = text;
      if (dateMatch) descText = descText.replace(dateMatch[0], '');
      if (creditMatch) descText = descText.replace(creditMatch[0], '');
      if (debitMatch) descText = descText.replace(debitMatch[0], '');
      if (balanceMatch) descText = descText.replace(balanceMatch[0], '');
      descText = descText.replace(/PKR/gi, '').trim();

      descriptionLines = descText ? [descText] : [];

      currentEntry = {
        id: `meezan-entry-${pageNum}-${i}-${Date.now()}`,
        bookingDate: dateStr,
        type,
        amount,
        credit: type === 'credit' ? amount : null,
        debit: type === 'debit' ? amount : null,
        availableBalance,
        pageNumber: pageNum,
      };
    } else if (currentEntry) {
      if (!/^\d+\s+\d{1,2}\s+[A-Za-z]+\s+\d{4}/.test(text) && !/^Page \d+/i.test(text)) {
        descriptionLines.push(text);
      }
    }
  }

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
export async function parseViaAiServer(
  file: File,
  bankType: BankType = 'hbl',
  pinToken?: string
): Promise<ParsedStatementResult> {
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
      bank: bankType,
    }),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        'AI OCR server endpoint (/api/parse-statement) returned 404 Not Found. Please ensure your backend server is running.'
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
      bookingDate: e.bookingDate || e.transactionDate || 'Unknown Date',
      valueDate: e.valueDate || e.bookingDate || e.transactionDate || undefined,
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
    bankType: bankType,
    bankName: data.bankName || (bankType === 'meezan' ? 'Meezan Bank' : 'Habib Bank Limited (HBL)'),
    accountTitle: data.accountTitle,
    accountNumber: data.accountNumber,
    iban: data.iban,
    cnic: data.cnic,
    branch: data.branch,
    openingBalance: data.openingBalance,
    closingBalance: data.closingBalance,
    statementDuration: data.statementDuration,
    entries: formattedEntries,
    summary: calculateSummary(formattedEntries),
    parsedAt: new Date().toISOString(),
  };
}

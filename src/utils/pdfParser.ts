import * as pdfjsLib from 'pdfjs-dist';
import { StatementEntry, ParsedStatementResult, BankType, ParseProgress, FailedPageInfo } from '../types';
import { calculateSummary } from '../data/summaryHelper';

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
  pinToken?: string,
  onProgress?: (progress: ParseProgress) => void,
  signal?: AbortSignal
): Promise<ParsedStatementResult> {
  if (bankType === 'meezan') {
    return parseMeezanPdf(file, pinToken, onProgress, signal);
  }
  return parseHblPdf(file, pinToken, onProgress, signal);
}

/**
 * Extracts transactions directly from a digital HBL PDF using coordinate and regex analysis.
 */
export async function parseHblPdf(
  file: File,
  pinToken?: string,
  onProgress?: (progress: ParseProgress) => void,
  signal?: AbortSignal
): Promise<ParsedStatementResult> {
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
      return parseViaAiServer(file, 'hbl', pinToken, onProgress, signal);
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
export async function parseMeezanPdf(
  file: File,
  pinToken?: string,
  onProgress?: (progress: ParseProgress) => void,
  signal?: AbortSignal
): Promise<ParsedStatementResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const allEntries: StatementEntry[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (signal?.aborted) {
      throw new Error('Document parsing cancelled.');
    }
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
      return parseViaAiServer(file, 'meezan', pinToken, onProgress, signal);
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

  const accNumMatch = fullText.match(/\b\d{14}\b/);
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
 * Renders a single PDF page into a high-quality JPEG base64 string using canvas.
 */
export async function renderPdfPageToJpeg(page: any, scale = 2.0): Promise<string> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context not available for PDF page rendering.');
  }

  // Draw solid white background in case PDF has transparent layers
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

  // Clean up canvas
  canvas.width = 0;
  canvas.height = 0;

  return dataUrl.split(',')[1];
}

/**
 * Sends a single page or image base64 payload to the backend AI OCR service
 */
async function sendPageToAiServer(
  fileBase64: string,
  mimeType: string,
  bankType: BankType,
  pinToken?: string,
  signal?: AbortSignal
): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (pinToken) {
    headers['X-AI-PIN-Token'] = pinToken;
  }

  const res = await fetch('/api/parse-statement', {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      fileBase64,
      mimeType,
      pinToken,
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

  return await res.json();
}

/**
 * Helper to normalize and type AI extracted transactions
 */
function formatAiEntries(rawEntries: any[], pageNumber: number): StatementEntry[] {
  return rawEntries.map((e: any, idx: number) => {
    const type: 'credit' | 'debit' =
      e.type === 'credit' || (e.credit && Number(e.credit) > 0) ? 'credit' : 'debit';
    const amount = Number(e.amount || e.credit || e.debit || 0);

    return {
      id: `ai-entry-p${pageNumber}-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingDate: e.bookingDate || e.transactionDate || 'Unknown Date',
      valueDate: e.valueDate || e.bookingDate || e.transactionDate || undefined,
      description: e.description || '',
      type,
      amount,
      credit: type === 'credit' ? amount : null,
      debit: type === 'debit' ? amount : null,
      availableBalance: e.availableBalance ? Number(e.availableBalance) : null,
      pageNumber,
    };
  });
}

/**
 * Parse via backend AI service for scanned PDF or image statements.
 * For PDFs, renders pages into high-res JPEGs and streams them page-by-page
 * to Gemini 3.5 Flash for reliable, fast processing with live progress updates.
 */
export async function parseViaAiServer(
  file: File,
  bankType: BankType = 'hbl',
  pinToken?: string,
  onProgress?: (progress: ParseProgress) => void,
  signal?: AbortSignal
): Promise<ParsedStatementResult> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  // Case 1: Direct Image (JPEG, PNG, WebP)
  if (!isPdf) {
    onProgress?.({
      stage: 'processing',
      currentPage: 1,
      totalPages: 1,
      message: 'Analyzing statement image with Gemini 3.5 Flash...',
      entriesFound: 0,
    });

    const base64 = await fileToBase64(file);
    const mimeType = file.type || 'image/jpeg';
    const pageData = await sendPageToAiServer(base64, mimeType, bankType, pinToken, signal);
    const formattedEntries = formatAiEntries(pageData.entries || [], 1);

    onProgress?.({
      stage: 'done',
      currentPage: 1,
      totalPages: 1,
      message: `Extraction complete: ${formattedEntries.length} transaction(s) found.`,
      entriesFound: formattedEntries.length,
    });

    return {
      fileName: file.name,
      pageCount: 1,
      bankType: bankType,
      bankName: pageData.bankName || (bankType === 'meezan' ? 'Meezan Bank (The Premier Islamic Bank)' : 'Habib Bank Limited (HBL)'),
      accountTitle: pageData.accountTitle,
      accountNumber: pageData.accountNumber,
      iban: pageData.iban,
      cnic: pageData.cnic,
      branch: pageData.branch,
      openingBalance: pageData.openingBalance,
      closingBalance: pageData.closingBalance,
      statementDuration: pageData.statementDuration,
      entries: formattedEntries,
      summary: calculateSummary(formattedEntries),
      parsedAt: new Date().toISOString(),
    };
  }

  // Case 2: Multi-page PDF
  onProgress?.({
    stage: 'reading',
    currentPage: 0,
    totalPages: 0,
    message: 'Reading PDF document structure...',
    entriesFound: 0,
  });

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  let combinedMetadata: Partial<ParsedStatementResult> = {
    bankType,
    bankName: bankType === 'meezan' ? 'Meezan Bank (The Premier Islamic Bank)' : 'Habib Bank Limited (HBL)',
  };

  const allEntries: StatementEntry[] = [];
  const failedPages: { pageNum: number; error: string; jpegBase64: string }[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (signal?.aborted) {
      throw new Error('AI statement scan was cancelled.');
    }

    onProgress?.({
      stage: 'rendering',
      currentPage: pageNum,
      totalPages: numPages,
      message: `Rendering page ${pageNum} of ${numPages} as high-res image...`,
      entriesFound: allEntries.length,
      failedPages: failedPages.map((f) => f.pageNum),
    });

    const page = await pdf.getPage(pageNum);
    const jpegBase64 = await renderPdfPageToJpeg(page, 2.0);

    onProgress?.({
      stage: 'processing',
      currentPage: pageNum,
      totalPages: numPages,
      message: `Analyzing page ${pageNum} of ${numPages} with Gemini 3.5 Flash...`,
      entriesFound: allEntries.length,
      failedPages: failedPages.map((f) => f.pageNum),
    });

    try {
      const pageData = await sendPageToAiServer(jpegBase64, 'image/jpeg', bankType, pinToken, signal);

      if (pageNum === 1) {
        combinedMetadata = {
          ...combinedMetadata,
          bankName: pageData.bankName || combinedMetadata.bankName,
          accountTitle: pageData.accountTitle,
          accountNumber: pageData.accountNumber,
          iban: pageData.iban,
          cnic: pageData.cnic,
          branch: pageData.branch,
          openingBalance: pageData.openingBalance,
          statementDuration: pageData.statementDuration,
        };
      }
      if (pageData.closingBalance !== undefined && pageData.closingBalance !== null) {
        combinedMetadata.closingBalance = pageData.closingBalance;
      }

      const pageEntries = formatAiEntries(pageData.entries || [], pageNum);
      allEntries.push(...pageEntries);

      onProgress?.({
        stage: 'processing',
        currentPage: pageNum,
        totalPages: numPages,
        message: `Page ${pageNum} complete: found ${pageEntries.length} transaction(s) (${allEntries.length} total)`,
        entriesFound: allEntries.length,
        failedPages: failedPages.map((f) => f.pageNum),
      });
    } catch (pageErr: any) {
      if (signal?.aborted) {
        throw new Error('AI statement scan was cancelled.');
      }
      console.warn(`Error scanning page ${pageNum} with AI:`, pageErr);
      failedPages.push({
        pageNum,
        error: pageErr?.message || 'Error parsing page',
        jpegBase64,
      });

      // If we are at the very last page and ZERO entries have been extracted so far, rethrow
      if (pageNum === numPages && allEntries.length === 0 && failedPages.length === numPages) {
        throw pageErr;
      }
    }
  }

  // Automatic retry pass for failed pages (using updated prompt & recovery mode)
  const remainingFailed: FailedPageInfo[] = [];

  if (failedPages.length > 0 && !signal?.aborted) {
    onProgress?.({
      stage: 'retrying',
      currentPage: failedPages[0].pageNum,
      totalPages: numPages,
      message: `Initial pass complete (${allEntries.length} transactions). Retrying ${failedPages.length} skipped page(s)...`,
      entriesFound: allEntries.length,
      failedPages: failedPages.map((f) => f.pageNum),
    });

    for (const failed of failedPages) {
      if (signal?.aborted) break;

      onProgress?.({
        stage: 'retrying',
        currentPage: failed.pageNum,
        totalPages: numPages,
        message: `Retrying Page ${failed.pageNum} with recovery mode...`,
        entriesFound: allEntries.length,
        failedPages: failedPages.map((f) => f.pageNum),
      });

      try {
        const retryData = await sendPageToAiServer(failed.jpegBase64, 'image/jpeg', bankType, pinToken, signal);
        const retryEntries = formatAiEntries(retryData.entries || [], failed.pageNum);
        allEntries.push(...retryEntries);

        onProgress?.({
          stage: 'retrying',
          currentPage: failed.pageNum,
          totalPages: numPages,
          message: `Page ${failed.pageNum} recovered! Found ${retryEntries.length} transaction(s).`,
          entriesFound: allEntries.length,
        });
      } catch (retryErr: any) {
        console.error(`Retry for page ${failed.pageNum} failed:`, retryErr);
        remainingFailed.push({
          pageNumber: failed.pageNum,
          reason: retryErr?.message || 'Unable to parse page.',
        });
      }
    }

    // Sort entries so rescanned pages are placed in correct page order
    allEntries.sort((a, b) => (a.pageNumber || 1) - (b.pageNumber || 1));
  }

  onProgress?.({
    stage: 'done',
    currentPage: numPages,
    totalPages: numPages,
    message: remainingFailed.length > 0
      ? `Scan finished with ${remainingFailed.length} skipped page(s). Extracted ${allEntries.length} transactions.`
      : `Scan complete! Extracted ${allEntries.length} transactions across ${numPages} page(s).`,
    entriesFound: allEntries.length,
    failedPages: remainingFailed.map((f) => f.pageNumber),
  });

  return {
    fileName: file.name,
    pageCount: numPages,
    bankType: combinedMetadata.bankType,
    bankName: combinedMetadata.bankName,
    accountTitle: combinedMetadata.accountTitle,
    accountNumber: combinedMetadata.accountNumber,
    iban: combinedMetadata.iban,
    cnic: combinedMetadata.cnic,
    branch: combinedMetadata.branch,
    openingBalance: combinedMetadata.openingBalance,
    closingBalance: combinedMetadata.closingBalance,
    statementDuration: combinedMetadata.statementDuration,
    entries: allEntries,
    summary: calculateSummary(allEntries),
    parsedAt: new Date().toISOString(),
    failedPages: remainingFailed.length > 0 ? remainingFailed : undefined,
  };
}

/**
 * Rescans a specific single page of a PDF statement on-demand
 */
export async function rescanSinglePdfPage(
  file: File,
  pageNumber: number,
  bankType: BankType = 'hbl',
  pinToken?: string,
  signal?: AbortSignal
): Promise<StatementEntry[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(`Page ${pageNumber} is out of bounds (document has ${pdf.numPages} pages).`);
  }

  const page = await pdf.getPage(pageNumber);
  const jpegBase64 = await renderPdfPageToJpeg(page, 2.0);
  const pageData = await sendPageToAiServer(jpegBase64, 'image/jpeg', bankType, pinToken, signal);

  return formatAiEntries(pageData.entries || [], pageNumber);
}

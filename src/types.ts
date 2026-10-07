export type BankType = 'hbl' | 'meezan';

export interface StatementEntry {
  id: string;
  bookingDate: string; // Transaction Date / Booking Date
  valueDate?: string;   // Value Date (HBL)
  description: string;
  type: 'credit' | 'debit';
  amount: number;
  credit?: number | null;
  debit?: number | null;
  availableBalance?: number | null;
  pageNumber?: number;
}

export interface StatementSummary {
  totalCredit: number;
  creditCount: number;
  totalDebit: number;
  debitCount: number;
  remittanceTotal: number;
  remittanceCount: number;
  remittanceFromTaptapTotal: number;
  remittanceFromTaptapCount: number;
  netFlow: number;
  totalTransactions: number;
}

export interface ParsedStatementResult {
  fileName: string;
  pageCount: number;
  bankType?: BankType;
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  cnic?: string;
  branch?: string;
  openingBalance?: number | null;
  closingBalance?: number | null;
  statementDuration?: string;
  entries: StatementEntry[];
  summary: StatementSummary;
  parsedAt: string;
}

export type StatementFilter = 'all' | 'credit' | 'debit' | 'remittance' | 'taptap';

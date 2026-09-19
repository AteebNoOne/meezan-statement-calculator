export interface StatementEntry {
  id: string;
  bookingDate: string;
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
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  entries: StatementEntry[];
  summary: StatementSummary;
  parsedAt: string;
}

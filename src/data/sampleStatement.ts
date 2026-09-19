import { ParsedStatementResult, StatementEntry, StatementSummary } from '../types';

export const SAMPLE_ENTRIES: StatementEntry[] = [
  {
    id: 'sample-1',
    bookingDate: '21 Jan 2026',
    description: 'Raast P2P Fund transfer - from AMNA WAJID RAAST PYxxxx0110 MBM810901494871707331',
    type: 'credit',
    amount: 1000.00,
    credit: 1000.00,
    debit: null,
    availableBalance: 11179.55,
    pageNumber: 1,
  },
  {
    id: 'sample-2',
    bookingDate: '21 Jan 2026',
    description: 'CHASE UP POS Transaction STAN (759518)',
    type: 'debit',
    amount: 5459.00,
    credit: null,
    debit: 5459.00,
    availableBalance: 5720.55,
    pageNumber: 1,
  },
  {
    id: 'sample-3',
    bookingDate: '21 Jan 2026',
    description: 'NAZEER IRANI CROCKERY POS Transaction STAN (367357)',
    type: 'debit',
    amount: 3900.00,
    credit: null,
    debit: 3900.00,
    availableBalance: 1820.55,
    pageNumber: 1,
  },
  {
    id: 'sample-4',
    bookingDate: '21 Jan 2026',
    description: 'Raast P2P Fund transfer - from BEHROZ KHAN RAAST PYxxxx2345 NAYA260121222540394735',
    type: 'credit',
    amount: 3000.00,
    credit: 3000.00,
    debit: null,
    availableBalance: 4820.55,
    pageNumber: 1,
  },
  {
    id: 'sample-5',
    bookingDate: '21 Jan 2026',
    description: 'DOLLAR SMART POS Transaction STAN (812829)',
    type: 'debit',
    amount: 2250.00,
    credit: null,
    debit: 2250.00,
    availableBalance: 2570.55,
    pageNumber: 1,
  },
  {
    id: 'sample-6',
    bookingDate: '22 Jan 2026',
    description: 'BANK CHARGES K BLOCK N NAZIMABAD KARACHI',
    type: 'debit',
    amount: 35.00,
    credit: null,
    debit: 35.00,
    availableBalance: 2535.55,
    pageNumber: 1,
  },
  {
    id: 'sample-7',
    bookingDate: '22 Jan 2026',
    description: 'ATM Cash Withdrawal K BLOCK N-NAZIMABAD KARACHI STAN (216181)',
    type: 'debit',
    amount: 2000.00,
    credit: null,
    debit: 2000.00,
    availableBalance: 535.55,
    pageNumber: 1,
  },
  {
    id: 'sample-8',
    bookingDate: '22 Jan 2026',
    description: 'Raast P2P Fund transfer to MUDASSAR AHMED PK67JCMAxxxx6605 AMEZNPKKA99910110994593260122110158',
    type: 'debit',
    amount: 300.00,
    credit: null,
    debit: 300.00,
    availableBalance: 235.55,
    pageNumber: 1,
  },
  {
    id: 'sample-9',
    bookingDate: '23 Jan 2026',
    description: 'Raast P2P Fund transfer - from BEHROZ KHAN RAAST PYxxxx2345 NAYA260123005705699415',
    type: 'credit',
    amount: 700.00,
    credit: 700.00,
    debit: null,
    availableBalance: 935.55,
    pageNumber: 1,
  },
  {
    id: 'sample-10',
    bookingDate: '23 Jan 2026',
    description: 'Money Received from BEHROZ KHAN 0141-****663993 STAN (602490)',
    type: 'credit',
    amount: 3600.00,
    credit: 3600.00,
    debit: null,
    availableBalance: 4535.55,
    pageNumber: 1,
  },
  {
    id: 'sample-11',
    bookingDate: '23 Jan 2026',
    description: 'ATM Cash Withdrawal SUMAIRA CHOWK STAN (860318)',
    type: 'debit',
    amount: 3500.00,
    credit: null,
    debit: 3500.00,
    availableBalance: 1035.55,
    pageNumber: 1,
  },
];

function isRemittanceEntry(entry: StatementEntry): boolean {
  const description = entry.description.toLowerCase();
  return (
    description.includes('raast') ||
    description.includes('fund transfer') ||
    description.includes('p2p') ||
    description.includes('remittance') ||
    description.includes('money received') ||
    description.includes('transfer') ||
    description.includes('taptap') ||
    description.includes('send uk')
  );
}

function isTaptapRemittanceEntry(entry: StatementEntry): boolean {
  const description = entry.description.toLowerCase();
  return description.includes('taptap');
}

export function calculateSummary(entries: StatementEntry[]): StatementSummary {
  let totalCredit = 0;
  let creditCount = 0;
  let totalDebit = 0;
  let debitCount = 0;
  let remittanceTotal = 0;
  let remittanceCount = 0;
  let remittanceFromTaptapTotal = 0;
  let remittanceFromTaptapCount = 0;

  for (const entry of entries) {
    if (entry.type === 'credit') {
      totalCredit += entry.amount || 0;
      creditCount += 1;
    } else if (entry.type === 'debit') {
      totalDebit += entry.amount || 0;
      debitCount += 1;
    }

    if (isRemittanceEntry(entry)) {
      remittanceTotal += entry.amount || 0;
      remittanceCount += 1;
    }

    if (isTaptapRemittanceEntry(entry)) {
      remittanceFromTaptapTotal += entry.amount || 0;
      remittanceFromTaptapCount += 1;
    }
  }

  return {
    totalCredit: Math.round(totalCredit * 100) / 100,
    creditCount,
    totalDebit: Math.round(totalDebit * 100) / 100,
    debitCount,
    remittanceTotal: Math.round(remittanceTotal * 100) / 100,
    remittanceCount,
    remittanceFromTaptapTotal: Math.round(remittanceFromTaptapTotal * 100) / 100,
    remittanceFromTaptapCount,
    netFlow: Math.round((totalCredit - totalDebit) * 100) / 100,
    totalTransactions: entries.length,
  };
}

export const SAMPLE_STATEMENT_RESULT: ParsedStatementResult = {
  fileName: 'Meezan_Account_Statement_Sample.pdf',
  pageCount: 1,
  bankName: 'Meezan Bank (The Premier Islamic Bank)',
  entries: SAMPLE_ENTRIES,
  summary: calculateSummary(SAMPLE_ENTRIES),
  parsedAt: new Date().toISOString(),
};

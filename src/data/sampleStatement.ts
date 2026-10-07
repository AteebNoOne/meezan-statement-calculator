import { ParsedStatementResult, StatementEntry, StatementSummary } from '../types';

export const SAMPLE_ENTRIES: StatementEntry[] = [
  {
    id: 'hbl-1',
    bookingDate: '30-06-2026',
    valueDate: '30-06-2026',
    description: 'Funds Transfer SM30170525EE76CB TO HAFIZ SYED SALMAN ALI (ASAAN AC IBAN XXXX-4881 Thru Raast MBMB13715986293609415',
    type: 'debit',
    amount: 500.00,
    credit: null,
    debit: 500.00,
    availableBalance: 25.00,
    pageNumber: 1,
  },
  {
    id: 'hbl-2',
    bookingDate: '30-06-2026',
    valueDate: '30-06-2026',
    description: 'Funds Transfer 1416321704250630 FRM HBL 04007902996003 883002584014 Thru Digital Banking PK41HABB0004007902996003 TANVEER SH',
    type: 'credit',
    amount: 25.00,
    credit: 25.00,
    debit: null,
    availableBalance: 525.00,
    pageNumber: 1,
  },
  {
    id: 'hbl-3',
    bookingDate: '29-06-2026',
    valueDate: '29-06-2026',
    description: 'Funds Transfer SM29032852CA9699 FR KONAIN HUSSAIN MERCHANT IBAN XXXX-2453 Thru Raast AMEZNPKKA99510105842453',
    type: 'credit',
    amount: 5000.00,
    credit: 5000.00,
    debit: null,
    availableBalance: 5041.30,
    pageNumber: 1,
  },
  {
    id: 'hbl-4',
    bookingDate: '29-06-2026',
    valueDate: '29-06-2026',
    description: 'AC Service Chgs 0400-CJSF4Z-001 SERVICES CHARGES CD/SB A/C',
    type: 'debit',
    amount: 41.30,
    credit: null,
    debit: 41.30,
    availableBalance: 5000.00,
    pageNumber: 1,
  },
  {
    id: 'hbl-5',
    bookingDate: '13-06-2026',
    valueDate: '13-06-2026',
    description: 'Funds Transfer 1378872245100613 FRM HBL 53687000010803 881311093813 Thru Digital Banking PK85HABB0053687000010803 OVAIS AHME',
    type: 'credit',
    amount: 97557.00,
    credit: 97557.00,
    debit: null,
    availableBalance: 147391.30,
    pageNumber: 4,
  },
  {
    id: 'hbl-6',
    bookingDate: '12-06-2026',
    valueDate: '12-06-2026',
    description: 'Swift Transfer 3638736883 3638736883 10832995 CANADA INC CAD 4,980.00',
    type: 'credit',
    amount: 992862.60,
    credit: 992862.60,
    debit: null,
    availableBalance: 1024695.93,
    pageNumber: 4,
  },
  {
    id: 'hbl-7',
    bookingDate: '12-06-2026',
    valueDate: '12-06-2026',
    description: 'With-Holding Tax 3638736883',
    type: 'debit',
    amount: 9928.63,
    credit: null,
    debit: 9928.63,
    availableBalance: 1014767.30,
    pageNumber: 4,
  },
  {
    id: 'hbl-8',
    bookingDate: '18-05-2026',
    valueDate: '18-05-2026',
    description: 'Swift Transfer 3632542846 3632542846 10832995 CANADA INC CAD 9,141.54',
    type: 'credit',
    amount: 1848602.22,
    credit: 1848602.22,
    debit: null,
    availableBalance: 1849080.03,
    pageNumber: 7,
  },
  {
    id: 'hbl-9',
    bookingDate: '18-05-2026',
    valueDate: '18-05-2026',
    description: 'With-Holding Tax 3632542846',
    type: 'debit',
    amount: 18486.95,
    credit: null,
    debit: 18486.95,
    availableBalance: 1830593.08,
    pageNumber: 7,
  },
  {
    id: 'hbl-10',
    bookingDate: '21-04-2026',
    valueDate: '21-04-2026',
    description: 'Swift Transfer 3624555738 3624555738 10832995 CANADA INC CAD 7,114.86',
    type: 'credit',
    amount: 1451502.59,
    credit: 1451502.59,
    debit: null,
    availableBalance: 1451534.67,
    pageNumber: 12,
  },
  {
    id: 'hbl-11',
    bookingDate: '21-04-2026',
    valueDate: '21-04-2026',
    description: 'With-Holding Tax 3624555738',
    type: 'debit',
    amount: 14515.31,
    credit: null,
    debit: 14515.31,
    availableBalance: 1437019.36,
    pageNumber: 12,
  },
  {
    id: 'hbl-12',
    bookingDate: '02-06-2026',
    valueDate: '02-06-2026',
    description: 'Funds Transfer 3032610119360602 FRM HBL 04007902996003 880203619130 Thru Digital Banking PK41HABB0004007902996003 TANVEER SH',
    type: 'credit',
    amount: 500000.00,
    credit: 500000.00,
    debit: null,
    availableBalance: 500153.08,
    pageNumber: 6,
  },
  {
    id: 'hbl-13',
    bookingDate: '06-06-2026',
    valueDate: '06-06-2026',
    description: 'Fee Fund Transfer Mobile Wallet IBFT CHARGES IBFT Charges for the Month MAY-2026',
    type: 'debit',
    amount: 626.75,
    credit: null,
    debit: 626.75,
    availableBalance: 63903.33,
    pageNumber: 5,
  },
  {
    id: 'hbl-14',
    bookingDate: '15-01-2026',
    valueDate: '15-01-2026',
    description: 'Foreign Inward Remittance From TAPTAP SEND UK-PAYABLE A/C NBP STAN(636148)',
    type: 'credit',
    amount: 15000.00,
    credit: 15000.00,
    debit: null,
    availableBalance: 89541.63,
    pageNumber: 21,
  },
];

export function isTaptapRemittanceEntry(entry: StatementEntry): boolean {
  if (entry.type !== 'credit') return false;
  const desc = (entry.description || '').toLowerCase();
  const normalized = desc.replace(/[\s\-_.]+/g, '');
  return (
    normalized.includes('taptap') ||
    desc.includes('tap tap') ||
    desc.includes('send uk') ||
    desc.includes('taptap send')
  );
}

export function isRemittanceEntry(entry: StatementEntry): boolean {
  if (entry.type !== 'credit') return false;
  const desc = (entry.description || '').toLowerCase();

  // 1. Taptap remittance is always a remittance
  if (isTaptapRemittanceEntry(entry)) {
    return true;
  }

  // 2. Foreign & Swift remittances and International channels
  return (
    desc.includes('swift transfer') ||
    desc.includes('canada inc') ||
    desc.includes('cad ') ||
    desc.includes('usd ') ||
    desc.includes('gbp ') ||
    desc.includes('eur ') ||
    desc.includes('remittance') ||
    desc.includes('home remit') ||
    desc.includes('inward remit') ||
    desc.includes('foreign remit') ||
    desc.includes('foreign inward') ||
    desc.includes('western union') ||
    desc.includes('moneygram') ||
    desc.includes('remitly') ||
    desc.includes('worldremit') ||
    desc.includes('ria ') ||
    desc.includes('ria remittance') ||
    desc.includes('ace money') ||
    desc.includes(' pri ') ||
    desc.startsWith('pri ') ||
    desc.includes('pri home')
  );
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
  fileName: 'HBL_Mobile_Account_Activity_Sample.pdf',
  pageCount: 47,
  bankName: 'Habib Bank Limited (HBL)',
  accountTitle: 'Designing Soul',
  accountNumber: '04007903010403',
  iban: 'PK17HABB0004007903010403',
  cnic: '4210129979891',
  branch: 'MUSLIM TOWN, KARACHI',
  openingBalance: 240.47,
  closingBalance: 25.00,
  statementDuration: '7/1/2025 12:00:00 AM till 6/30/2026 12:00:00 AM',
  entries: SAMPLE_ENTRIES,
  summary: calculateSummary(SAMPLE_ENTRIES),
  parsedAt: new Date().toISOString(),
};

import { StatementEntry, StatementSummary } from '../types';

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

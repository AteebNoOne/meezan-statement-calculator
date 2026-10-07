import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSummary, isRemittanceEntry, isTaptapRemittanceEntry } from './summaryHelper';
import { StatementEntry } from '../types';

const MOCK_ENTRIES: StatementEntry[] = [
  {
    id: 'test-1',
    bookingDate: '01-01-2025',
    description: 'Standard Salary Credit',
    type: 'credit',
    amount: 100000,
    credit: 100000,
    debit: null,
  },
  {
    id: 'test-2',
    bookingDate: '02-01-2025',
    description: 'Utility Bill Payment',
    type: 'debit',
    amount: 15000,
    credit: null,
    debit: 15000,
  },
  {
    id: 'test-3',
    bookingDate: '03-01-2025',
    description: 'Foreign Inward Remittance SWIFT Transfer',
    type: 'credit',
    amount: 50000,
    credit: 50000,
    debit: null,
  },
  {
    id: 'test-4',
    bookingDate: '04-01-2025',
    description: 'Foreign Inward Remittance From Taptap Send UK',
    type: 'credit',
    amount: 25000,
    credit: 25000,
    debit: null,
  },
];

describe('calculateSummary and remittance filters', () => {
  it('correctly calculates total credits, total debits, and net flow', () => {
    const summary = calculateSummary(MOCK_ENTRIES);

    assert.equal(summary.totalCredit, 175000);
    assert.equal(summary.creditCount, 3);
    assert.equal(summary.totalDebit, 15000);
    assert.equal(summary.debitCount, 1);
    assert.equal(summary.netFlow, 160000);
    assert.equal(summary.totalTransactions, 4);
  });

  it('correctly isolates foreign remittances and TapTap Send remittances', () => {
    const summary = calculateSummary(MOCK_ENTRIES);

    assert.equal(summary.remittanceTotal, 75000); // 50000 SWIFT + 25000 Taptap
    assert.equal(summary.remittanceCount, 2);
    assert.equal(summary.remittanceFromTaptapTotal, 25000);
    assert.equal(summary.remittanceFromTaptapCount, 1);
  });

  it('correctly identifies remittance entries', () => {
    assert.equal(isRemittanceEntry(MOCK_ENTRIES[0]), false);
    assert.equal(isRemittanceEntry(MOCK_ENTRIES[1]), false);
    assert.equal(isRemittanceEntry(MOCK_ENTRIES[2]), true);
    assert.equal(isRemittanceEntry(MOCK_ENTRIES[3]), true);
    assert.equal(isTaptapRemittanceEntry(MOCK_ENTRIES[3]), true);
    assert.equal(isTaptapRemittanceEntry(MOCK_ENTRIES[2]), false);
  });
});

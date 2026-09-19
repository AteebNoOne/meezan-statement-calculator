import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSummary } from './sampleStatement';

describe('calculateSummary', () => {
  it('only includes Credit (+) entries in remittance totals and excludes Debit (-) transfers', () => {
    const entries = [
      {
        id: '1',
        bookingDate: '01 Jan 2026',
        description: 'Raast P2P Fund transfer - from ALI',
        type: 'credit' as const,
        amount: 1000,
        credit: 1000,
        debit: null,
        availableBalance: 2000,
      },
      {
        id: '2',
        bookingDate: '02 Jan 2026',
        description: 'Remittance from TAPTAP SEND UK-PAYABLE ACCOUNT',
        type: 'credit' as const,
        amount: 1500,
        credit: 1500,
        debit: null,
        availableBalance: 3500,
      },
      {
        id: '3',
        bookingDate: '03 Jan 2026',
        description: 'Raast P2P Fund transfer to MUDASSAR AHMED',
        type: 'debit' as const,
        amount: 500,
        credit: null,
        debit: 500,
        availableBalance: 3000,
      },
      {
        id: '4',
        bookingDate: '04 Jan 2026',
        description: 'TAPTAP Fee Payment or Outward Transfer',
        type: 'debit' as const,
        amount: 200,
        credit: null,
        debit: 200,
        availableBalance: 2800,
      },
      {
        id: '5',
        bookingDate: '05 Jan 2026',
        description: 'Groceries payment',
        type: 'debit' as const,
        amount: 50,
        credit: null,
        debit: 50,
        availableBalance: 2750,
      },
    ];

    const summary = calculateSummary(entries);

    // Total credits: 1000 + 1500 = 2500
    assert.equal(summary.totalCredit, 2500);
    assert.equal(summary.creditCount, 2);

    // Total debits: 500 + 200 + 50 = 750
    assert.equal(summary.totalDebit, 750);
    assert.equal(summary.debitCount, 3);

    // Remittance must only count Credits (entry 1: 1000, entry 2: 1500 = 2500)
    // Entry 3 (debit transfer) and Entry 4 (debit taptap) must NOT be counted
    assert.equal(summary.remittanceTotal, 2500);
    assert.equal(summary.remittanceCount, 2);

    // Taptap remittance must only count Credit (entry 2: 1500)
    assert.equal(summary.remittanceFromTaptapTotal, 1500);
    assert.equal(summary.remittanceFromTaptapCount, 1);

    // Remittance total must be <= total credit
    assert.ok(summary.remittanceTotal <= summary.totalCredit);
  });
});

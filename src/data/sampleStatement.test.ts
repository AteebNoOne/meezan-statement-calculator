import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSummary } from './sampleStatement';

describe('calculateSummary', () => {
  it('includes remittance totals for transfer-related entries and Taptap-only remittance totals', () => {
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
        description: 'TAPTAP SEND UK-PAYABLE ACCOUNT NBP XXXX4253027386 STAN(636148)',
        type: 'debit' as const,
        amount: 1500,
        credit: null,
        debit: 1500,
        availableBalance: 500,
      },
      {
        id: '3',
        bookingDate: '03 Jan 2026',
        description: 'Groceries payment',
        type: 'debit' as const,
        amount: 50,
        credit: null,
        debit: 50,
        availableBalance: 450,
      },
    ];

    const summary = calculateSummary(entries);

    assert.equal(summary.remittanceTotal, 2500);
    assert.equal(summary.remittanceCount, 2);
    assert.equal(summary.remittanceFromTaptapTotal, 1500);
    assert.equal(summary.remittanceFromTaptapCount, 1);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSummary } from './sampleStatement';

describe('calculateSummary', () => {
  it('only includes genuine foreign Remittance Credit (+) entries and excludes local Raast/transfers', () => {
    const entries = [
      {
        id: '1',
        bookingDate: '01 Jan 2026',
        description: 'Raast P2P Fund transfer - from ALI RAAST PYMT',
        type: 'credit' as const,
        amount: 1000,
        credit: 1000,
        debit: null,
        availableBalance: 2000,
      },
      {
        id: '2',
        bookingDate: '02 Jan 2026',
        description: 'Money Received from BEHROZ KHAN 0141-****663993 STAN (602490)',
        type: 'credit' as const,
        amount: 500,
        credit: 500,
        debit: null,
        availableBalance: 2500,
      },
      {
        id: '3',
        bookingDate: '03 Jan 2026',
        description: 'Remittance From TAPTAP SEND UK-PAYABLE ACCOUNT NBP XXXX4253027386 STAN(636148)',
        type: 'credit' as const,
        amount: 1500,
        credit: 1500,
        debit: null,
        availableBalance: 4000,
      },
      {
        id: '4',
        bookingDate: '04 Jan 2026',
        description: 'Remittance From SHEHROZ KHAN WAHID KHAN FAYSAL XXXXZ030027965 STAN(547871)',
        type: 'credit' as const,
        amount: 2000,
        credit: 2000,
        debit: null,
        availableBalance: 6000,
      },
      {
        id: '5',
        bookingDate: '05 Jan 2026',
        description: 'Raast P2P Fund transfer to MUDASSAR AHMED',
        type: 'debit' as const,
        amount: 500,
        credit: null,
        debit: 500,
        availableBalance: 5500,
      },
      {
        id: '6',
        bookingDate: '06 Jan 2026',
        description: 'Groceries POS payment',
        type: 'debit' as const,
        amount: 50,
        credit: null,
        debit: 50,
        availableBalance: 5450,
      },
    ];

    const summary = calculateSummary(entries);

    // Total credits: 1000 (Raast) + 500 (Money Received) + 1500 (TapTap) + 2000 (Remittance) = 5000
    assert.equal(summary.totalCredit, 5000);
    assert.equal(summary.creditCount, 4);

    // Total debits: 500 + 50 = 550
    assert.equal(summary.totalDebit, 550);
    assert.equal(summary.debitCount, 2);

    // Remittance must only count genuine Remittances (entry 3: 1500, entry 4: 2000 = 3500)
    // Domestic Raast (entry 1) and Money Received (entry 2) are NOT remittances!
    assert.equal(summary.remittanceTotal, 3500);
    assert.equal(summary.remittanceCount, 2);

    // Taptap remittance must only count entry 3 (1500)
    assert.equal(summary.remittanceFromTaptapTotal, 1500);
    assert.equal(summary.remittanceFromTaptapCount, 1);

    // Remittance total must be strictly <= total credit
    assert.ok(summary.remittanceTotal <= summary.totalCredit);
  });
});

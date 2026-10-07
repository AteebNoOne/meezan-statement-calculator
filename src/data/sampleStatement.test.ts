import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSummary, isRemittanceEntry, isTaptapRemittanceEntry, SAMPLE_ENTRIES } from './sampleStatement';

describe('calculateSummary for HBL Bank Statement', () => {
  it('correctly calculates total credits, total debits, and separates foreign/Swift remittances from local transfers', () => {
    const summary = calculateSummary(SAMPLE_ENTRIES);

    // Total Credits & Debits must be positive numbers
    assert.ok(summary.totalCredit > 0);
    assert.ok(summary.totalDebit > 0);
    assert.equal(summary.totalTransactions, SAMPLE_ENTRIES.length);

    // Check that Swift transfers & TapTap are counted in Remittance total
    // From sample:
    // Swift 1: 992,862.60
    // Swift 2: 1,848,602.22
    // Swift 3: 1,451,502.59
    // TapTap Send: 15,000.00
    // Expected Remittance Total: 992862.60 + 1848602.22 + 1451502.59 + 15000 = 4,307,967.41
    const expectedRemittanceTotal = 992862.60 + 1848602.22 + 1451502.59 + 15000;
    assert.equal(summary.remittanceTotal, expectedRemittanceTotal);
    assert.equal(summary.remittanceCount, 4);

    // TapTap Send must be counted separately
    assert.equal(summary.remittanceFromTaptapTotal, 15000);
    assert.equal(summary.remittanceFromTaptapCount, 1);

    // Remittance total must be strictly less than or equal to total credits
    assert.ok(summary.remittanceTotal <= summary.totalCredit);

    // Local transfers like Tanveer Sh (25), Konain Hussain (5000), Ovais Ahme (97557), Tanveer Sh (500000) are NOT remittances
    assert.ok(summary.totalCredit > summary.remittanceTotal);
  });
});

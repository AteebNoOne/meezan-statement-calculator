import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSummary } from './summaryHelper';
import { HBL_SAMPLE_ENTRIES } from './hblStatement';
import { MEEZAN_SAMPLE_ENTRIES } from './meezanStatement';

describe('calculateSummary for HBL Bank Statement', () => {
  it('correctly calculates total credits, total debits, and separates foreign/Swift remittances from local transfers', () => {
    const summary = calculateSummary(HBL_SAMPLE_ENTRIES);

    assert.ok(summary.totalCredit > 0);
    assert.ok(summary.totalDebit > 0);
    assert.equal(summary.totalTransactions, HBL_SAMPLE_ENTRIES.length);

    // Swift 1 (992862.60) + Swift 2 (1848602.22) + Swift 3 (1451502.59) + TapTap (15000)
    const expectedRemittanceTotal = 992862.60 + 1848602.22 + 1451502.59 + 15000;
    assert.equal(summary.remittanceTotal, expectedRemittanceTotal);
    assert.equal(summary.remittanceCount, 4);

    assert.equal(summary.remittanceFromTaptapTotal, 15000);
    assert.equal(summary.remittanceFromTaptapCount, 1);
  });
});

describe('calculateSummary for Meezan Bank Statement', () => {
  it('correctly calculates total credits, total debits, and separates remittances for Meezan statement', () => {
    const summary = calculateSummary(MEEZAN_SAMPLE_ENTRIES);

    assert.ok(summary.totalCredit > 0);
    assert.ok(summary.totalDebit > 0);
    assert.equal(summary.totalTransactions, MEEZAN_SAMPLE_ENTRIES.length);

    // Remittance entries in Meezan: 15000 (TapTap) + 38875 (Foreign Remittance) = 53875
    assert.equal(summary.remittanceTotal, 53875);
    assert.equal(summary.remittanceCount, 2);

    assert.equal(summary.remittanceFromTaptapTotal, 15000);
    assert.equal(summary.remittanceFromTaptapCount, 1);
  });
});

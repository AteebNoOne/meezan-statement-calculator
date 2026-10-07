import { BankType, ParsedStatementResult, StatementEntry } from '../types';
import { HBL_SAMPLE_ENTRIES, HBL_SAMPLE_RESULT } from './hblStatement';
import { MEEZAN_SAMPLE_ENTRIES, MEEZAN_SAMPLE_RESULT } from './meezanStatement';
export { calculateSummary, isRemittanceEntry, isTaptapRemittanceEntry } from './summaryHelper';
export { HBL_SAMPLE_ENTRIES, HBL_SAMPLE_RESULT } from './hblStatement';
export { MEEZAN_SAMPLE_ENTRIES, MEEZAN_SAMPLE_RESULT } from './meezanStatement';

export const SAMPLE_ENTRIES: StatementEntry[] = HBL_SAMPLE_ENTRIES;
export const SAMPLE_STATEMENT_RESULT: ParsedStatementResult = HBL_SAMPLE_RESULT;

export function getSampleStatement(bank: BankType): ParsedStatementResult {
  return bank === 'meezan' ? MEEZAN_SAMPLE_RESULT : HBL_SAMPLE_RESULT;
}

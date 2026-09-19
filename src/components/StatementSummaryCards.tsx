import { StatementSummary } from '../types';
import { TrendingUp, TrendingDown, DollarSign, ListFilter, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface SummaryCardsProps {
  summary: StatementSummary;
  onFilterChange: (filter: 'all' | 'credit' | 'debit') => void;
  currentFilter: 'all' | 'credit' | 'debit';
}

export function StatementSummaryCards({
  summary,
  onFilterChange,
  currentFilter,
}: SummaryCardsProps) {
  const [copied, setCopied] = useState(false);

  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const handleCopySummary = () => {
    const text = `Meezan Statement Summary:
-------------------------
Total Credits (+): + PKR ${formatPKR(summary.totalCredit)} (${summary.creditCount} entries)
Total Debits (-): - PKR ${formatPKR(summary.totalDebit)} (${summary.debitCount} entries)
Net Difference: ${summary.netFlow >= 0 ? '+' : '-'} PKR ${formatPKR(summary.netFlow)}
Total Entries: ${summary.totalTransactions}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="summary-section" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Statement Calculation Summary</h2>
          <p className="text-xs text-slate-500">Auto-calculated sum of all credit (+) and debit (-) entries</p>
        </div>
        <button
          id="copy-summary-btn"
          onClick={handleCopySummary}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
          {copied ? 'Summary Copied!' : 'Copy Summary'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Credit Card - Green with + sign */}
        <div
          id="card-credits"
          onClick={() => onFilterChange(currentFilter === 'credit' ? 'all' : 'credit')}
          className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
            currentFilter === 'credit'
              ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-400/20'
              : 'bg-white border-emerald-200/80 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Credits (+)
            </span>
            <span className="text-xs font-medium text-emerald-700">
              {summary.creditCount} {summary.creditCount === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <div className="mt-1">
            <div className="text-2xl font-black tracking-tight text-emerald-600">
              + PKR {formatPKR(summary.totalCredit)}
            </div>
            <p className="text-xs text-emerald-700/80 mt-1">
              Green column total deposits & received
            </p>
          </div>
          {currentFilter === 'credit' && (
            <div className="mt-2 pt-2 border-t border-emerald-200 text-[11px] font-medium text-emerald-800">
              Filtering table: Showing Credits only
            </div>
          )}
        </div>

        {/* Total Debit Card - Red with - sign */}
        <div
          id="card-debits"
          onClick={() => onFilterChange(currentFilter === 'debit' ? 'all' : 'debit')}
          className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
            currentFilter === 'debit'
              ? 'bg-rose-50/80 border-rose-500 shadow-sm ring-2 ring-rose-400/20'
              : 'bg-white border-rose-200/80 hover:border-rose-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              Debits (-)
            </span>
            <span className="text-xs font-medium text-rose-700">
              {summary.debitCount} {summary.debitCount === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <div className="mt-1">
            <div className="text-2xl font-black tracking-tight text-rose-600">
              - PKR {formatPKR(summary.totalDebit)}
            </div>
            <p className="text-xs text-rose-700/80 mt-1">
              Red column total withdrawals & charges
            </p>
          </div>
          {currentFilter === 'debit' && (
            <div className="mt-2 pt-2 border-t border-rose-200 text-[11px] font-medium text-rose-800">
              Filtering table: Showing Debits only
            </div>
          )}
        </div>

        {/* Net Flow Card */}
        <div
          id="card-net-flow"
          className="relative p-4 rounded-xl bg-white border border-slate-200 shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
              <DollarSign className="w-3.5 h-3.5 text-slate-600" />
              Net Cash Flow
            </span>
            <span className="text-xs font-medium text-slate-500">Credits − Debits</span>
          </div>
          <div className="mt-1">
            <div
              className={`text-2xl font-black tracking-tight ${
                summary.netFlow > 0
                  ? 'text-emerald-600'
                  : summary.netFlow < 0
                  ? 'text-rose-600'
                  : 'text-slate-800'
              }`}
            >
              {summary.netFlow > 0 ? '+' : summary.netFlow < 0 ? '-' : ''} PKR {formatPKR(summary.netFlow)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {summary.netFlow >= 0 ? 'Net positive movement' : 'Net expenditure outflow'}
            </p>
          </div>
        </div>

        {/* Total Records Card */}
        <div
          id="card-total-records"
          onClick={() => onFilterChange('all')}
          className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
            currentFilter === 'all'
              ? 'bg-purple-50/80 border-[#681c5a] shadow-sm ring-2 ring-[#681c5a]/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-[#581c53]">
              <ListFilter className="w-3.5 h-3.5 text-[#681c5a]" />
              Total Entries
            </span>
            <span className="text-xs font-medium text-[#681c5a]">All rows</span>
          </div>
          <div className="mt-1">
            <div className="text-2xl font-black tracking-tight text-[#581c53]">
              {summary.totalTransactions}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {summary.creditCount} Credits &middot; {summary.debitCount} Debits
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

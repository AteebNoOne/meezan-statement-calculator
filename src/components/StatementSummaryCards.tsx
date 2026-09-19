import { StatementSummary } from '../types';
import { TrendingUp, TrendingDown, DollarSign, ListFilter, Copy, Check, ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';
import taptapIcon from '../data/taptap.png';

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
Remittance Received (+): + PKR ${formatPKR(summary.remittanceTotal)} (${summary.remittanceCount} entries)
Taptap Remittance (+): + PKR ${formatPKR(summary.remittanceFromTaptapTotal)} (${summary.remittanceFromTaptapCount} entries)
Net Difference: ${summary.netFlow >= 0 ? '+' : '-'} PKR ${formatPKR(summary.netFlow)}
Total Entries: ${summary.totalTransactions} (${summary.creditCount} Credits, ${summary.debitCount} Debits)`;

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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs hover:shadow transition-all cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
          {copied ? 'Summary Copied!' : 'Copy Summary'}
        </button>
      </div>

      {/* Depth & Responsive Grid: 1 col on mobile, 2 on sm, 3 on lg, 6 on 2xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3.5 lg:gap-4">
        {/* Total Credit Card - Green with + sign */}
        <div
          id="card-credits"
          onClick={() => onFilterChange(currentFilter === 'credit' ? 'all' : 'credit')}
          className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
            currentFilter === 'credit'
              ? 'bg-gradient-to-b from-emerald-50 to-emerald-100/60 border-emerald-500 shadow-md ring-2 ring-emerald-400/30 -translate-y-0.5'
              : 'bg-gradient-to-b from-white to-emerald-50/20 border-emerald-200/90 hover:border-emerald-400 shadow-xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 shadow-xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Credits (+)
            </span>
            <span className="text-xs font-medium text-emerald-700">
              {summary.creditCount} {summary.creditCount === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <div className="mt-1">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-xs sm:text-sm font-black text-emerald-600 tracking-wide select-none shrink-0">+ PKR</span>
              <span
                className="text-xl sm:text-2xl 2xl:text-xl font-black tracking-tight text-emerald-600 whitespace-normal break-all sm:break-normal select-all"
              >
                {formatPKR(summary.totalCredit)}
              </span>
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
          className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
            currentFilter === 'debit'
              ? 'bg-gradient-to-b from-rose-50 to-rose-100/60 border-rose-500 shadow-md ring-2 ring-rose-400/30 -translate-y-0.5'
              : 'bg-gradient-to-b from-white to-rose-50/20 border-rose-200/90 hover:border-rose-400 shadow-xs hover:shadow-md hover:shadow-rose-500/10 hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 shadow-xs">
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              Debits (-)
            </span>
            <span className="text-xs font-medium text-rose-700">
              {summary.debitCount} {summary.debitCount === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <div className="mt-1">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-xs sm:text-sm font-black text-rose-600 tracking-wide select-none shrink-0">- PKR</span>
              <span
                className="text-xl sm:text-2xl 2xl:text-xl font-black tracking-tight text-rose-600 whitespace-normal break-all sm:break-normal select-all"
              >
                {formatPKR(summary.totalDebit)}
              </span>
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

        {/* Remittance Total Card - Inward Credit Remittances */}
        <div
          id="card-remittance-total"
          className="relative p-4 rounded-xl bg-gradient-to-b from-white to-sky-50/30 border border-sky-200 shadow-xs hover:shadow-md hover:shadow-sky-500/10 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 shadow-xs">
              <ArrowLeftRight className="w-3.5 h-3.5 text-sky-600" />
              Remittance (+)
            </span>
            <span className="text-xs font-medium text-sky-700">{summary.remittanceCount} entries</span>
          </div>
          <div className="mt-1">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-xs sm:text-sm font-black text-sky-700 tracking-wide select-none shrink-0">+ PKR</span>
              <span
                className="text-xl sm:text-2xl 2xl:text-xl font-black tracking-tight text-sky-700 whitespace-normal break-all sm:break-normal select-all"
              >
                {formatPKR(summary.remittanceTotal)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Credit (+) transfers & remittances
            </p>
          </div>
        </div>

        {/* Taptap Remittance Card - Inward Credit Taptap Remittances */}
        <div
          id="card-remittance-taptap"
          className="relative p-4 rounded-xl bg-gradient-to-b from-white to-amber-50/30 border border-amber-200 shadow-xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-white bg-white shadow-xs shrink-0">
                <img src={taptapIcon} alt="Taptap" className="w-full h-full object-cover" />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 shadow-xs">
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-700 mr-1" />
                Taptap (+)
              </span>
            </div>
            <span className="text-xs font-medium text-amber-700 whitespace-nowrap">
              {summary.remittanceFromTaptapCount} entries
            </span>
          </div>
          <div className="mt-1">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-xs sm:text-sm font-black text-amber-700 tracking-wide select-none shrink-0">+ PKR</span>
              <span
                className="text-xl sm:text-2xl 2xl:text-xl font-black tracking-tight text-amber-700 whitespace-normal break-all sm:break-normal select-all"
              >
                {formatPKR(summary.remittanceFromTaptapTotal)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Received via TapTap Send (+)
            </p>
          </div>
        </div>

        {/* Net Flow Card */}
        <div
          id="card-net-flow"
          className="relative p-4 rounded-xl bg-gradient-to-b from-white to-slate-50/40 border border-slate-200 shadow-xs hover:shadow-md hover:shadow-slate-500/10 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 shadow-xs">
              <DollarSign className="w-3.5 h-3.5 text-slate-600" />
              Net Cash Flow
            </span>
            <span className="text-xs font-medium text-slate-500">Credits − Debits</span>
          </div>
          <div className="mt-1">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span
                className={`text-xs sm:text-sm font-black tracking-wide select-none shrink-0 ${
                  summary.netFlow > 0 ? 'text-emerald-600' : summary.netFlow < 0 ? 'text-rose-600' : 'text-slate-800'
                }`}
              >
                {summary.netFlow > 0 ? '+ PKR' : summary.netFlow < 0 ? '- PKR' : 'PKR'}
              </span>
              <span
                className={`text-xl sm:text-2xl 2xl:text-xl font-black tracking-tight whitespace-normal break-all sm:break-normal select-all ${
                  summary.netFlow > 0
                    ? 'text-emerald-600'
                    : summary.netFlow < 0
                    ? 'text-rose-600'
                    : 'text-slate-800'
                }`}
              >
                {formatPKR(summary.netFlow)}
              </span>
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
          className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
            currentFilter === 'all'
              ? 'bg-gradient-to-b from-purple-50 to-purple-100/60 border-[#681c5a] shadow-md ring-2 ring-[#681c5a]/30 -translate-y-0.5'
              : 'bg-gradient-to-b from-white to-purple-50/20 border-slate-200 hover:border-purple-300 shadow-xs hover:shadow-md hover:shadow-purple-500/10 hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-[#581c53] shadow-xs">
              <ListFilter className="w-3.5 h-3.5 text-[#681c5a]" />
              Total Entries
            </span>
            <span className="text-xs font-medium text-[#681c5a]">All rows</span>
          </div>
          <div className="mt-1">
            <div
              className="text-xl sm:text-2xl 2xl:text-xl font-black tracking-tight text-[#581c53] select-all"
            >
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

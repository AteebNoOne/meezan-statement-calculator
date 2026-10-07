import React from 'react';
import { User, CreditCard, Building2, Calendar, Wallet, FileSpreadsheet } from 'lucide-react';
import { ParsedStatementResult } from '../types';

interface AccountInfoCardProps {
  data: ParsedStatementResult;
}

export function AccountInfoCard({ data }: AccountInfoCardProps) {
  const formatPKR = (amount?: number | null) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const hasAnyAccountData =
    data.accountTitle ||
    data.accountNumber ||
    data.iban ||
    data.openingBalance !== undefined ||
    data.closingBalance !== undefined;

  if (!hasAnyAccountData) return null;

  return (
    <div id="account-info-card" className="bg-white border border-emerald-100 rounded-xl shadow-xs overflow-hidden">
      <div className="bg-gradient-to-r from-[#008269] to-[#006752] px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-200" />
          <span className="font-bold text-sm tracking-tight">HBL Account Profile</span>
          {data.branch && (
            <span className="text-xs text-emerald-100 font-normal">
              &bull; Branch: {data.branch}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-100">
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
          <span>{data.fileName}</span>
          {data.pageCount > 0 && <span>({data.pageCount} pages)</span>}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {/* Account Title */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1">
            <User className="w-3.5 h-3.5 text-[#008269]" />
            Account Title
          </div>
          <div className="font-bold text-slate-800 text-sm truncate" title={data.accountTitle || 'N/A'}>
            {data.accountTitle || 'N/A'}
          </div>
        </div>

        {/* Account Number */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1">
            <CreditCard className="w-3.5 h-3.5 text-[#008269]" />
            Account Number
          </div>
          <div className="font-bold text-slate-800 text-xs font-mono tracking-wider truncate" title={data.accountNumber || 'N/A'}>
            {data.accountNumber || 'N/A'}
          </div>
        </div>

        {/* IBAN */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 sm:col-span-1 lg:col-span-2">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1">
            <Building2 className="w-3.5 h-3.5 text-[#008269]" />
            IBAN
          </div>
          <div className="font-bold text-slate-800 text-xs font-mono tracking-tight truncate" title={data.iban || 'N/A'}>
            {data.iban || 'N/A'}
          </div>
        </div>

        {/* Opening Balance */}
        <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
          <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-medium mb-1">
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            Opening Balance
          </div>
          <div className="font-bold text-emerald-700 text-sm font-mono">
            PKR {formatPKR(data.openingBalance)}
          </div>
        </div>

        {/* Closing Balance */}
        <div className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-100">
          <div className="flex items-center gap-1.5 text-teal-800 text-[11px] font-medium mb-1">
            <Wallet className="w-3.5 h-3.5 text-teal-600" />
            Closing Balance
          </div>
          <div className="font-bold text-teal-700 text-sm font-mono">
            PKR {formatPKR(data.closingBalance)}
          </div>
        </div>
      </div>

      {data.statementDuration && (
        <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>Statement Duration: {data.statementDuration}</span>
        </div>
      )}
    </div>
  );
}

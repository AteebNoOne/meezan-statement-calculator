import React from 'react';
import { User, CreditCard, Building2, Calendar, Wallet, FileSpreadsheet } from 'lucide-react';
import { ParsedStatementResult, BankType } from '../types';

interface AccountInfoCardProps {
  data: ParsedStatementResult;
  bankType?: BankType;
}

export function AccountInfoCard({ data, bankType }: AccountInfoCardProps) {
  const activeBank = bankType || data.bankType || 'hbl';
  const isHbl = activeBank === 'hbl';

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
    <div
      id="account-info-card"
      className={`bg-white rounded-xl shadow-xs overflow-hidden border ${
        isHbl ? 'border-emerald-100' : 'border-purple-100'
      }`}
    >
      <div
        className={`px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2 transition-colors duration-200 ${
          isHbl ? 'bg-gradient-to-r from-[#008269] to-[#006752]' : 'bg-gradient-to-r from-[#581c53] to-[#7b2874]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Building2 className={`w-4 h-4 ${isHbl ? 'text-emerald-200' : 'text-purple-200'}`} />
          <span className="font-bold text-sm tracking-tight">
            {isHbl ? 'HBL Account Profile' : 'Meezan Bank Account Profile'}
          </span>
          {data.branch && (
            <span className={`text-xs font-normal ${isHbl ? 'text-emerald-100' : 'text-purple-100'}`}>
              &bull; Branch: {data.branch}
            </span>
          )}
        </div>
        <div className={`flex items-center gap-2 text-xs ${isHbl ? 'text-emerald-100' : 'text-purple-100'}`}>
          <FileSpreadsheet className={`w-3.5 h-3.5 ${isHbl ? 'text-emerald-200' : 'text-purple-200'}`} />
          <span>{data.fileName}</span>
          {data.pageCount > 0 && <span>({data.pageCount} pages)</span>}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {/* Account Title */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1">
            <User className={`w-3.5 h-3.5 ${isHbl ? 'text-[#008269]' : 'text-[#581c53]'}`} />
            Account Title
          </div>
          <div className="font-bold text-slate-800 text-sm truncate" title={data.accountTitle || 'N/A'}>
            {data.accountTitle || 'N/A'}
          </div>
        </div>

        {/* Account Number */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1">
            <CreditCard className={`w-3.5 h-3.5 ${isHbl ? 'text-[#008269]' : 'text-[#581c53]'}`} />
            Account Number
          </div>
          <div className="font-bold text-slate-800 text-xs font-mono tracking-wider truncate" title={data.accountNumber || 'N/A'}>
            {data.accountNumber || 'N/A'}
          </div>
        </div>

        {/* IBAN */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 sm:col-span-1 lg:col-span-2">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1">
            <Building2 className={`w-3.5 h-3.5 ${isHbl ? 'text-[#008269]' : 'text-[#581c53]'}`} />
            IBAN
          </div>
          <div className="font-bold text-slate-800 text-xs font-mono tracking-tight truncate" title={data.iban || 'N/A'}>
            {data.iban || 'N/A'}
          </div>
        </div>

        {/* Opening Balance */}
        <div className={`p-2.5 rounded-lg border ${isHbl ? 'bg-emerald-50/60 border-emerald-100' : 'bg-purple-50/60 border-purple-100'}`}>
          <div className={`flex items-center gap-1.5 text-[11px] font-medium mb-1 ${isHbl ? 'text-emerald-800' : 'text-purple-800'}`}>
            <Wallet className={`w-3.5 h-3.5 ${isHbl ? 'text-emerald-600' : 'text-purple-600'}`} />
            Opening Balance
          </div>
          <div className={`font-bold text-sm font-mono ${isHbl ? 'text-emerald-700' : 'text-purple-700'}`}>
            PKR {formatPKR(data.openingBalance)}
          </div>
        </div>

        {/* Closing Balance */}
        <div className={`p-2.5 rounded-lg border ${isHbl ? 'bg-teal-50/60 border-teal-100' : 'bg-amber-50/60 border-amber-100'}`}>
          <div className={`flex items-center gap-1.5 text-[11px] font-medium mb-1 ${isHbl ? 'text-teal-800' : 'text-amber-800'}`}>
            <Wallet className={`w-3.5 h-3.5 ${isHbl ? 'text-teal-600' : 'text-amber-600'}`} />
            Closing Balance
          </div>
          <div className={`font-bold text-sm font-mono ${isHbl ? 'text-teal-700' : 'text-amber-700'}`}>
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

import React from 'react';
import { Landmark, ShieldCheck } from 'lucide-react';

export function HblHeader() {
  return (
    <header id="hbl-header" className="bg-[#008269] text-white shadow-md border-b border-[#006752]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-xs p-1.5 shrink-0">
              <div className="w-full h-full rounded-md bg-[#008269] flex items-center justify-center text-white font-bold text-base tracking-tighter">
                <Landmark className="w-5 h-5 text-emerald-200" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  HBL Statement Calculator
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  Habib Bank Limited
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Instant extraction & sum calculation for HBL Bank PDF account statements
              </p>
            </div>
          </div>

          {/* Color & Sign Rule Badges */}
          <div className="flex items-center gap-2 text-xs">
            <div className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-300/40 text-emerald-100 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
              Credit Column: <span className="text-emerald-200 font-mono">+ PKR</span>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-rose-500/20 border border-rose-300/40 text-rose-100 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Debit Column: <span className="text-rose-200 font-mono">- PKR</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

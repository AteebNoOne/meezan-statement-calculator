import React, { useState, useRef, useEffect } from 'react';
import { Landmark, ShieldCheck, ChevronDown, Check, Building2 } from 'lucide-react';
import { BankType } from '../types';

interface BankNavbarProps {
  currentBank: BankType;
  onBankChange: (bank: BankType) => void;
}

export function BankNavbar({ currentBank, onBankChange }: BankNavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHbl = currentBank === 'hbl';

  return (
    <header
      id="main-bank-header"
      className={`text-white shadow-md transition-colors duration-300 ${
        isHbl ? 'bg-[#008269] border-b border-[#006752]' : 'bg-[#581c53] border-b border-[#441440]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: Brand Icon, Title & Bank Switcher */}
          <div className="flex items-center gap-3">
            {/* Logo Icon */}
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-xs p-1.5 shrink-0">
              <div
                className={`w-full h-full rounded-md flex items-center justify-center text-white font-bold text-base transition-colors duration-300 ${
                  isHbl ? 'bg-[#008269]' : 'bg-[#581c53]'
                }`}
              >
                <Landmark className={`w-5 h-5 ${isHbl ? 'text-emerald-200' : 'text-emerald-400'}`} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {isHbl ? 'HBL Statement Calculator' : 'Meezan Statement Calculator'}
                </h1>

                {/* Bank Switcher Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    id="bank-switcher-btn"
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white shadow-xs transition-all cursor-pointer select-none"
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                  >
                    <Building2 className="w-3.5 h-3.5 text-white/90" />
                    <span>Bank: {isHbl ? 'HBL Bank' : 'Meezan Bank'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800">
                      <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        Select Bank Statement
                      </div>

                      {/* HBL Option */}
                      <button
                        type="button"
                        onClick={() => {
                          onBankChange('hbl');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isHbl ? 'bg-emerald-50 text-[#008269] font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full bg-[#008269] ring-2 ring-emerald-200 shrink-0"></span>
                          <div>
                            <div className="font-semibold text-slate-900">HBL Bank</div>
                            <div className="text-[10px] text-slate-500 font-normal">Habib Bank Limited</div>
                          </div>
                        </div>
                        {isHbl && <Check className="w-4 h-4 text-[#008269]" />}
                      </button>

                      {/* Meezan Option */}
                      <button
                        type="button"
                        onClick={() => {
                          onBankChange('meezan');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          !isHbl ? 'bg-purple-50 text-[#581c53] font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full bg-[#581c53] ring-2 ring-purple-200 shrink-0"></span>
                          <div>
                            <div className="font-semibold text-slate-900">Meezan Bank</div>
                            <div className="text-[10px] text-slate-500 font-normal">The Premier Islamic Bank</div>
                          </div>
                        </div>
                        {!isHbl && <Check className="w-4 h-4 text-[#581c53]" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Subtitle tag */}
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium bg-black/20 text-white/90 px-2 py-0.5 rounded-full border border-white/20">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  {isHbl ? 'Habib Bank Limited' : 'Islamic Banking'}
                </span>
              </div>

              <p className="text-xs text-white/80 mt-0.5">
                {isHbl
                  ? 'Instant extraction & sum calculation for HBL Bank PDF account statements'
                  : 'Instant extraction & sum calculation for Meezan Bank PDF account statements'}
              </p>
            </div>
          </div>

          {/* Right: Color Rule Badges */}
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

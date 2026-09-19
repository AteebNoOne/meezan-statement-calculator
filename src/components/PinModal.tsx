import React, { useState, useRef, useEffect } from 'react';
import { Lock, X, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token?: string) => void;
}

// Expected SHA-256 hash for authorization (Plaintext PIN is never stored in source code)
const EXPECTED_PIN_HASH = '210c4b3f4e5c7040f24c73a529421079d00afd42f62ec5c17b6805c9cf220478';

async function computeSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function PinModal({ isOpen, onClose, onSuccess }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length === 0) {
      setError('Please enter the security PIN.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // 1. Try server-side verification first
      const serverRes = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      }).catch(() => null);

      if (serverRes && serverRes.ok) {
        const data = await serverRes.json();
        if (data.valid) {
          onSuccess(data.token);
          onClose();
          return;
        }
      }

      // 2. Client-side SHA-256 hash check fallback
      const enteredHash = await computeSha256(pin);
      if (enteredHash === EXPECTED_PIN_HASH) {
        onSuccess('client-verified');
        onClose();
        return;
      }

      setError('Incorrect security PIN. Access denied.');
      setPin('');
      inputRef.current?.focus();
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
    >
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-[#581c53] to-[#7b2874] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shadow-xs">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 id="pin-modal-title" className="text-sm font-bold tracking-tight">
                AI OCR Authorization
              </h3>
              <p className="text-[11px] text-purple-200">Security PIN required</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-600 font-medium">
              Enter your 4-digit PIN to enable AI OCR document processing:
            </p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <input
              ref={inputRef}
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                if (error) setError(null);
              }}
              placeholder="••••"
              autoComplete="one-time-code"
              className="w-40 text-center tracking-[0.5em] text-2xl font-black py-2.5 px-4 bg-slate-50 border-2 border-slate-300 rounded-xl focus:border-[#581c53] focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-500/15 transition-all text-slate-800"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || pin.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#581c53] hover:bg-[#461541] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Unlock AI OCR
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useRef, useState } from 'react';
import { Upload, FileText, Sparkles, AlertCircle, RefreshCw, Lock, ShieldCheck } from 'lucide-react';
import { PinModal } from './PinModal';

interface FileUploadAreaProps {
  onFileSelected: (file: File, forceAi?: boolean, pinToken?: string) => void;
  isLoading: boolean;
  loadingMessage: string;
  errorMessage: string | null;
  activeFileName?: string;
  onReset: () => void;
}

export function FileUploadArea({
  onFileSelected,
  isLoading,
  loadingMessage,
  errorMessage,
  activeFileName,
  onReset,
}: FileUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [forceAi, setForceAi] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinToken, setPinToken] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelected(file, forceAi, pinToken);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelected(file, forceAi, pinToken);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  const handleToggleAi = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setIsPinModalOpen(true);
    } else {
      setForceAi(false);
      setPinToken(undefined);
    }
  };

  const handlePinSuccess = (token?: string) => {
    setForceAi(true);
    setPinToken(token);
    setIsPinModalOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Upload Box */}
      <div
        id="pdf-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-[#581c53] bg-purple-50/70 scale-[1.005]'
            : 'border-slate-300 hover:border-[#581c53]/70 hover:bg-slate-50/60 bg-white'
        } ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          id="statement-file-input"
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <RefreshCw className="w-8 h-8 text-[#581c53] animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-800">{loadingMessage}</p>
            <p className="text-xs text-slate-500 mt-1">
              Extracting date, description, credit (+ green) and debit (- red) columns...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-purple-100/80 flex items-center justify-center text-[#581c53] mb-3">
              <Upload className="w-6 h-6" />
            </div>

            <h3 className="text-base font-semibold text-slate-800">
              {activeFileName ? `Change Statement: ${activeFileName}` : 'Drop Meezan Bank Statement PDF here'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Drag and drop your account statement PDF or click to browse. Supports digital statements and scanned page photos.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                PDF Document
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700">
                <span className="font-bold">+</span> Green Credit Column
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700">
                <span className="font-bold">-</span> Red Debit Column
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Helper Actions & Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 select-none">
            <input
              type="checkbox"
              id="toggle-force-ai"
              checked={forceAi}
              onChange={handleToggleAi}
              className="rounded border-slate-300 text-[#581c53] focus:ring-[#581c53] w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1.5 font-medium text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Use AI OCR (Recommended for photos / camera scans)
            </span>
          </label>

          {forceAi ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shadow-2xs">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> PIN Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              <Lock className="w-2.5 h-2.5 text-slate-400" /> PIN Protected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFileName && (
            <button
              id="reset-statement-btn"
              type="button"
              onClick={onReset}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* PIN Verification Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
      />

      {/* Error alert if any */}
      {errorMessage && (
        <div id="upload-error-alert" className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Unable to process document: </span>
            {errorMessage}
            <div className="mt-1 text-[11px] text-rose-700">
              Try uploading a clearer PDF or enable AI OCR for better extraction.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

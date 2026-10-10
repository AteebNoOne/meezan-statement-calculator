import { useState, useRef } from 'react';
import { BankNavbar } from './components/BankNavbar';
import { AccountInfoCard } from './components/AccountInfoCard';
import { FileUploadArea } from './components/FileUploadArea';
import { StatementSummaryCards } from './components/StatementSummaryCards';
import { StatementTable } from './components/StatementTable';
import { ParsedStatementResult, StatementEntry, StatementFilter, BankType, ParseProgress } from './types';
import { calculateSummary } from './data/summaryHelper';
import { parseStatementPdf, parseViaAiServer, rescanSinglePdfPage } from './utils/pdfParser';
import { FileCheck, FileText, Plus, AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentBank, setCurrentBank] = useState<BankType>('hbl');
  const [statementData, setStatementData] = useState<ParsedStatementResult | null>(null);
  const [currentFilter, setCurrentFilter] = useState<StatementFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parseProgress, setParseProgress] = useState<ParseProgress | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [activePinToken, setActivePinToken] = useState<string | undefined>(undefined);
  const [rescanningPage, setRescanningPage] = useState<number | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  const isHbl = currentBank === 'hbl';

  const handleBankChange = (newBank: BankType) => {
    setCurrentBank(newBank);
    setStatementData(null);
    setCurrentFile(null);
    setCurrentFilter('all');
    setErrorMessage(null);
    setParseProgress(null);
  };

  const handleRescanPage = async (pageNumber: number) => {
    if (!currentFile || !statementData) return;
    setRescanningPage(pageNumber);
    setErrorMessage(null);

    try {
      const recoveredEntries = await rescanSinglePdfPage(
        currentFile,
        pageNumber,
        currentBank,
        activePinToken
      );

      // Merge recovered entries, avoiding duplicates for this page
      const existingWithoutThisPage = statementData.entries.filter(
        (e) => e.pageNumber !== pageNumber
      );
      const updatedEntries = [...existingWithoutThisPage, ...recoveredEntries].sort(
        (a, b) => (a.pageNumber || 1) - (b.pageNumber || 1)
      );

      // Remove pageNumber from failedPages
      const updatedFailedPages = statementData.failedPages?.filter(
        (fp) => fp.pageNumber !== pageNumber
      );

      setStatementData({
        ...statementData,
        entries: updatedEntries,
        summary: calculateSummary(updatedEntries),
        failedPages: updatedFailedPages && updatedFailedPages.length > 0 ? updatedFailedPages : undefined,
      });
    } catch (err: any) {
      console.error(`Failed to rescan page ${pageNumber}:`, err);
      setErrorMessage(`Failed to rescan Page ${pageNumber}: ${err?.message || 'Unknown error'}`);
    } finally {
      setRescanningPage(null);
    }
  };

  const handleCancelScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsLoading(false);
    setParseProgress(null);
    setLoadingMessage('');
    setErrorMessage('Statement scan was cancelled by user.');
  };

  const handleFileSelected = async (file: File, forceAi = false, pinToken?: string) => {
    setCurrentFile(file);
    setActivePinToken(pinToken);
    setIsLoading(true);
    setErrorMessage(null);
    setParseProgress(null);
    setElapsedSeconds(0);

    // Abort any prior in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Start elapsed seconds timer
    if (timerRef.current) window.clearInterval(timerRef.current);
    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const bankName = isHbl ? 'HBL' : 'Meezan Bank';

    const onProgress = (prog: ParseProgress) => {
      setParseProgress(prog);
      setLoadingMessage(prog.message);
    };

    try {
      if (!forceAi && isPdf) {
        setLoadingMessage(`Reading digital ${bankName} statement tables...`);
        const result = await parseStatementPdf(file, currentBank, pinToken, onProgress, abortController.signal);
        setStatementData(result);
      } else {
        setLoadingMessage(`Analyzing ${bankName} statement with Gemini 3.5 Flash...`);
        const result = await parseViaAiServer(file, currentBank, pinToken, onProgress, abortController.signal);
        setStatementData(result);
      }
    } catch (err: any) {
      if (abortController.signal.aborted || err?.name === 'AbortError' || err?.message?.includes('cancelled')) {
        setErrorMessage('Statement scan was cancelled.');
        return;
      }
      console.error('File parsing error:', err);
      if (!forceAi && pinToken) {
        try {
          setLoadingMessage('Retrying with Gemini 3.5 Flash Enhanced Scanner...');
          const aiResult = await parseViaAiServer(file, currentBank, pinToken, onProgress, abortController.signal);
          setStatementData(aiResult);
          return;
        } catch (aiErr: any) {
          if (abortController.signal.aborted || aiErr?.name === 'AbortError' || aiErr?.message?.includes('cancelled')) {
            setErrorMessage('Statement scan was cancelled.');
            return;
          }
          console.error('AI Fallback error:', aiErr);
          setErrorMessage(
            aiErr?.message || err?.message || `Failed to extract statement data. Please ensure it is a valid ${bankName} statement.`
          );
        }
      } else {
        setErrorMessage(err?.message || `Failed to extract statement data. Please ensure it is a valid ${bankName} statement.`);
      }
    } finally {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsLoading(false);
      setParseProgress(null);
    }
  };

  const handleReset = () => {
    setCurrentFile(null);
    setActivePinToken(undefined);
    setStatementData(null);
    setErrorMessage(null);
  };

  const handleCreateBlank = () => {
    setStatementData({
      fileName: `Manual_${isHbl ? 'HBL' : 'Meezan'}_Statement.pdf`,
      pageCount: 1,
      bankType: currentBank,
      bankName: isHbl ? 'Habib Bank Limited (HBL)' : 'Meezan Bank (The Premier Islamic Bank)',
      entries: [],
      summary: calculateSummary([]),
      parsedAt: new Date().toISOString(),
    });
    setErrorMessage(null);
  };

  const handleUpdateEntry = (updated: StatementEntry) => {
    if (!statementData) return;
    const newEntries = statementData.entries.map((e) => (e.id === updated.id ? updated : e));
    setStatementData({
      ...statementData,
      entries: newEntries,
      summary: calculateSummary(newEntries),
    });
  };

  const handleDeleteEntry = (id: string) => {
    if (!statementData) return;
    const newEntries = statementData.entries.filter((e) => e.id !== id);
    setStatementData({
      ...statementData,
      entries: newEntries,
      summary: calculateSummary(newEntries),
    });
  };

  const handleAddEntry = (newEntry: StatementEntry) => {
    if (!statementData) {
      const entries = [newEntry];
      setStatementData({
        fileName: `Manual_${isHbl ? 'HBL' : 'Meezan'}_Statement.pdf`,
        pageCount: 1,
        bankType: currentBank,
        bankName: isHbl ? 'Habib Bank Limited (HBL)' : 'Meezan Bank (The Premier Islamic Bank)',
        entries,
        summary: calculateSummary(entries),
        parsedAt: new Date().toISOString(),
      });
      return;
    }

    const newEntries = [newEntry, ...statementData.entries];
    setStatementData({
      ...statementData,
      entries: newEntries,
      summary: calculateSummary(newEntries),
    });
  };

  const handleExportCsv = () => {
    if (!statementData || statementData.entries.length === 0) return;

    const headers = isHbl
      ? ['Transaction Date', 'Value Date', 'Description', 'Type', 'Credit (PKR)', 'Debit (PKR)', 'Balance (PKR)']
      : ['Booking Date', 'Description', 'Type', 'Credit (PKR)', 'Debit (PKR)', 'Available Balance (PKR)'];

    const rows = statementData.entries.map((e) => {
      if (isHbl) {
        return [
          `"${e.bookingDate.replace(/"/g, '""')}"`,
          `"${(e.valueDate || e.bookingDate).replace(/"/g, '""')}"`,
          `"${e.description.replace(/"/g, '""')}"`,
          e.type,
          e.type === 'credit' ? e.amount.toFixed(2) : '',
          e.type === 'debit' ? e.amount.toFixed(2) : '',
          e.availableBalance !== null && e.availableBalance !== undefined ? e.availableBalance.toFixed(2) : '',
        ];
      }
      return [
        `"${e.bookingDate.replace(/"/g, '""')}"`,
        `"${e.description.replace(/"/g, '""')}"`,
        e.type,
        e.type === 'credit' ? e.amount.toFixed(2) : '',
        e.type === 'debit' ? e.amount.toFixed(2) : '',
        e.availableBalance !== null && e.availableBalance !== undefined ? e.availableBalance.toFixed(2) : '',
      ];
    });

    // Add summary row
    rows.push([]);
    rows.push(
      isHbl
        ? [
            '"TOTALS"',
            '',
            `"${statementData.entries.length} transactions"`,
            '',
            `"+${statementData.summary.totalCredit.toFixed(2)}"`,
            `"-${statementData.summary.totalDebit.toFixed(2)}"`,
            `"Net: ${statementData.summary.netFlow.toFixed(2)}"`,
          ]
        : [
            '"TOTALS"',
            `"${statementData.entries.length} entries"`,
            '',
            `"+${statementData.summary.totalCredit.toFixed(2)}"`,
            `"-${statementData.summary.totalDebit.toFixed(2)}"`,
            `"Net: ${statementData.summary.netFlow.toFixed(2)}"`,
          ]
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${isHbl ? 'hbl' : 'meezan'}_statement_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Navbar with Bank Switcher Dropdown */}
      <BankNavbar currentBank={currentBank} onBankChange={handleBankChange} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Upload & Controls Section */}
        <section aria-label="Statement Upload">
          <FileUploadArea
            onFileSelected={handleFileSelected}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            errorMessage={errorMessage}
            activeFileName={statementData?.fileName}
            onReset={handleReset}
            bankType={currentBank}
            progress={parseProgress}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancelScan}
          />
        </section>

        {/* Account Profile Card */}
        {statementData && (
          <section aria-label="Account Profile">
            <AccountInfoCard data={statementData} bankType={currentBank} />
          </section>
        )}

        {/* Loaded Document Info Banner */}
        {statementData && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <FileCheck className={`w-4 h-4 ${isHbl ? 'text-[#008269]' : 'text-[#581c53]'}`} />
              <span className="font-semibold text-slate-800">{statementData.fileName}</span>
              {statementData.pageCount > 0 && (
                <span className="text-slate-400">&bull; {statementData.pageCount} page(s)</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">
                Calculated {statementData.entries.length} transactions across Credit & Debit columns
              </span>
            </div>
          </div>
        )}

        {/* Failed Pages Warning & Rescan Banner */}
        {statementData && statementData.failedPages && statementData.failedPages.length > 0 && (
          <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-semibold text-amber-950">
                  {statementData.failedPages.length === 1
                    ? `Page ${statementData.failedPages[0].pageNumber} was skipped during scan`
                    : `${statementData.failedPages.length} pages were skipped during scan`}
                </span>
                <span className="text-amber-800 text-[11px] block sm:inline sm:ml-1.5">
                  ({statementData.entries.length} transactions from other {statementData.pageCount - statementData.failedPages.length} page(s) loaded successfully).
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {statementData.failedPages.map((fp) => (
                <button
                  key={fp.pageNumber}
                  type="button"
                  disabled={rescanningPage === fp.pageNumber}
                  onClick={() => handleRescanPage(fp.pageNumber)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${rescanningPage === fp.pageNumber ? 'animate-spin' : ''}`} />
                  {rescanningPage === fp.pageNumber ? `Rescanning Page ${fp.pageNumber}...` : `Rescan Page ${fp.pageNumber}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clean Empty State when no statement is loaded */}
        {!statementData && (
          <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-white/60 text-slate-500">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700">No Statement Loaded</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Upload your {isHbl ? 'HBL' : 'Meezan Bank'} account statement PDF or image above to calculate totals, or start with a blank table.
            </p>
            <div className="mt-4">
              <button
                type="button"
                id="create-blank-btn"
                onClick={handleCreateBlank}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                Start with a blank sheet
              </button>
            </div>
          </div>
        )}

        {/* Summary Cards with Separate Totals & Remittances */}
        {statementData && (
          <section aria-label="Summary Totals">
            <StatementSummaryCards
              summary={statementData.summary}
              onFilterChange={setCurrentFilter}
              currentFilter={currentFilter}
              bankType={currentBank}
            />
          </section>
        )}

        {/* Transactions Table */}
        {statementData && (
          <section aria-label="Transactions Table">
            <StatementTable
              entries={statementData.entries}
              currentFilter={currentFilter}
              onFilterChange={setCurrentFilter}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
              onAddEntry={handleAddEntry}
              onExportCsv={handleExportCsv}
              bankType={currentBank}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            {isHbl
              ? 'HBL Statement Calculator • Habib Bank Limited Account Activity & Foreign/Swift Remittance Analyzer'
              : 'Meezan Statement Calculator • Green (+) Credit entries & Red (-) Debit entries sum computation tool'}
          </p>
        </div>
      </footer>
    </div>
  );
}

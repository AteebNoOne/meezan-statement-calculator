import React, { useState } from 'react';
import { HblHeader } from './components/HblHeader';
import { AccountInfoCard } from './components/AccountInfoCard';
import { FileUploadArea } from './components/FileUploadArea';
import { StatementSummaryCards } from './components/StatementSummaryCards';
import { StatementTable } from './components/StatementTable';
import { ParsedStatementResult, StatementEntry, StatementFilter } from './types';
import { calculateSummary, SAMPLE_STATEMENT_RESULT } from './data/sampleStatement';
import { parseHblPdf, parseViaAiServer } from './utils/pdfParser';
import { FileCheck, Sparkles } from 'lucide-react';

export default function App() {
  const [statementData, setStatementData] = useState<ParsedStatementResult | null>(SAMPLE_STATEMENT_RESULT);
  const [currentFilter, setCurrentFilter] = useState<StatementFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (file: File, forceAi = false, pinToken?: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    try {
      if (!forceAi && isPdf) {
        setLoadingMessage('Processing HBL PDF pages and reading transaction tables...');
        const result = await parseHblPdf(file, pinToken);
        setStatementData(result);
      } else {
        setLoadingMessage('Scanning HBL statement with AI recognition...');
        const result = await parseViaAiServer(file, pinToken);
        setStatementData(result);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      // If client-side failed and user had pinToken, attempt AI fallback
      if (!forceAi && pinToken) {
        try {
          setLoadingMessage('Retrying with AI Enhanced Scanner...');
          const aiResult = await parseViaAiServer(file, pinToken);
          setStatementData(aiResult);
          return;
        } catch (aiErr: any) {
          console.error('AI Fallback error:', aiErr);
          setErrorMessage(aiErr?.message || err?.message || 'Failed to extract statement data. Please ensure it is a valid HBL statement.');
        }
      } else {
        setErrorMessage(err?.message || 'Failed to extract statement data. Please ensure it is a valid HBL statement.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStatementData(null);
    setErrorMessage(null);
  };

  const handleLoadSample = () => {
    setStatementData(SAMPLE_STATEMENT_RESULT);
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
        fileName: 'Manual_HBL_Statement.pdf',
        pageCount: 1,
        bankName: 'Habib Bank Limited (HBL)',
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

    const headers = ['Transaction Date', 'Value Date', 'Description', 'Type', 'Credit (PKR)', 'Debit (PKR)', 'Balance (PKR)'];
    const rows = statementData.entries.map((e) => [
      `"${e.bookingDate.replace(/"/g, '""')}"`,
      `"${(e.valueDate || e.bookingDate).replace(/"/g, '""')}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      e.type,
      e.type === 'credit' ? e.amount.toFixed(2) : '',
      e.type === 'debit' ? e.amount.toFixed(2) : '',
      e.availableBalance !== null && e.availableBalance !== undefined ? e.availableBalance.toFixed(2) : '',
    ]);

    // Add summary row
    rows.push([]);
    rows.push([
      '"TOTALS"',
      '',
      `"${statementData.entries.length} transactions"`,
      '',
      `"+${statementData.summary.totalCredit.toFixed(2)}"`,
      `"-${statementData.summary.totalDebit.toFixed(2)}"`,
      `"Net: ${statementData.summary.netFlow.toFixed(2)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hbl_statement_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      <HblHeader />

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
          />
        </section>

        {/* Account Profile Card (if available) */}
        {statementData && (
          <section aria-label="Account Profile">
            <AccountInfoCard data={statementData} />
          </section>
        )}

        {/* Loaded Document Info Banner */}
        {statementData && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#008269]" />
              <span className="font-semibold text-slate-800">{statementData.fileName}</span>
              {statementData.pageCount > 0 && (
                <span className="text-slate-400">&bull; {statementData.pageCount} page(s)</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">
                Calculated {statementData.entries.length} transactions across Credit & Debit columns
              </span>
              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-1 text-[11px] text-[#008269] hover:underline cursor-pointer font-medium"
              >
                <Sparkles className="w-3 h-3 text-[#008269]" />
                Reload Sample
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
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            HBL Statement Calculator &bull; Habib Bank Limited Account Activity & Foreign/Swift Remittance Analyzer
          </p>
        </div>
      </footer>
    </div>
  );
}

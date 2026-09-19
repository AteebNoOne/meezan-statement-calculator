import React, { useState } from 'react';
import { MeezanHeader } from './components/MeezanHeader';
import { FileUploadArea } from './components/FileUploadArea';
import { StatementSummaryCards } from './components/StatementSummaryCards';
import { StatementTable } from './components/StatementTable';
import { ParsedStatementResult, StatementEntry } from './types';
import { calculateSummary } from './data/sampleStatement';
import { parseMeezanPdf, parseViaAiServer } from './utils/pdfParser';
import { FileCheck } from 'lucide-react';

export default function App() {
  const [statementData, setStatementData] = useState<ParsedStatementResult | null>(null);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (file: File, forceAi = false) => {
    setIsLoading(true);
    setErrorMessage(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    try {
      if (!forceAi && isPdf) {
        setLoadingMessage('Processing PDF pages and reading transaction tables...');
        const result = await parseMeezanPdf(file);
        setStatementData(result);
      } else {
        setLoadingMessage('Scanning statement with AI recognition...');
        const result = await parseViaAiServer(file);
        setStatementData(result);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      // If client-side failed, attempt AI fallback if not tried yet
      if (!forceAi) {
        try {
          setLoadingMessage('Retrying with AI Enhanced Scanner...');
          const aiResult = await parseViaAiServer(file);
          setStatementData(aiResult);
          return;
        } catch (aiErr: any) {
          console.error('AI Fallback error:', aiErr);
          setErrorMessage(aiErr?.message || err?.message || 'Failed to extract statement data. Please ensure it is a valid Meezan statement.');
        }
      } else {
        setErrorMessage(err?.message || 'Failed to extract statement data via AI.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStatementData(null);
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
        fileName: 'Manual_Statement.pdf',
        pageCount: 1,
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

    const headers = ['Booking Date', 'Description', 'Type', 'Credit (PKR)', 'Debit (PKR)', 'Available Balance (PKR)'];
    const rows = statementData.entries.map((e) => [
      `"${e.bookingDate.replace(/"/g, '""')}"`,
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
      `"${statementData.entries.length} entries"`,
      '',
      `"+${statementData.summary.totalCredit.toFixed(2)}"`,
      `"-${statementData.summary.totalDebit.toFixed(2)}"`,
      `"Net: ${statementData.summary.netFlow.toFixed(2)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `meezan_statement_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      <MeezanHeader />

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

        {/* Loaded Document Info Banner */}
        {statementData && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#581c53]" />
              <span className="font-semibold text-slate-800">{statementData.fileName}</span>
              {statementData.pageCount > 0 && (
                <span className="text-slate-400">&bull; {statementData.pageCount} page(s)</span>
              )}
            </div>
            <div className="text-slate-500">
              Calculated {statementData.entries.length} transactions across Credit & Debit columns
            </div>
          </div>
        )}

        {/* Summary Cards */}
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
            Meezan Statement Calculator &bull; Green (+) Credit entries & Red (-) Debit entries sum computation tool
          </p>
        </div>
      </footer>
    </div>
  );
}

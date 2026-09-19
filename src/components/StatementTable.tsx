import React, { useState } from 'react';
import { StatementEntry, StatementFilter } from '../types';
import { isRemittanceEntry, isTaptapRemittanceEntry } from '../data/sampleStatement';
import { Search, Plus, Trash2, Edit2, Check, X, Download, ArrowUpDown } from 'lucide-react';

interface StatementTableProps {
  entries: StatementEntry[];
  currentFilter: StatementFilter;
  onFilterChange: (filter: StatementFilter) => void;
  onUpdateEntry: (updated: StatementEntry) => void;
  onDeleteEntry: (id: string) => void;
  onAddEntry: (newEntry: StatementEntry) => void;
  onExportCsv: () => void;
}

export function StatementTable({
  entries,
  currentFilter,
  onFilterChange,
  onUpdateEntry,
  onDeleteEntry,
  onAddEntry,
  onExportCsv,
}: StatementTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<StatementEntry | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEntryForm, setNewEntryForm] = useState({
    bookingDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    description: '',
    type: 'credit' as 'credit' | 'debit',
    amount: '',
    availableBalance: '',
  });

  const formatPKR = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '';
    return new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const filteredEntries = entries.filter((entry) => {
    if (currentFilter === 'credit' && entry.type !== 'credit') return false;
    if (currentFilter === 'debit' && entry.type !== 'debit') return false;
    if (currentFilter === 'remittance' && !isRemittanceEntry(entry)) return false;
    if (currentFilter === 'taptap' && !isTaptapRemittanceEntry(entry)) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        entry.description.toLowerCase().includes(q) ||
        entry.bookingDate.toLowerCase().includes(q) ||
        entry.amount.toString().includes(q)
      );
    }
    return true;
  });

  const startEdit = (entry: StatementEntry) => {
    setEditingId(entry.id);
    setEditForm({ ...entry });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (!editForm) return;
    const amountVal = Number(editForm.amount) || 0;
    const updated: StatementEntry = {
      ...editForm,
      amount: amountVal,
      credit: editForm.type === 'credit' ? amountVal : null,
      debit: editForm.type === 'debit' ? amountVal : null,
      availableBalance: editForm.availableBalance ? Number(editForm.availableBalance) : null,
    };
    onUpdateEntry(updated);
    setEditingId(null);
    setEditForm(null);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newEntryForm.amount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    const created: StatementEntry = {
      id: `manual-${Date.now()}`,
      bookingDate: newEntryForm.bookingDate || '21 Jan 2026',
      description: newEntryForm.description || 'Manual Entry',
      type: newEntryForm.type,
      amount: amountVal,
      credit: newEntryForm.type === 'credit' ? amountVal : null,
      debit: newEntryForm.type === 'debit' ? amountVal : null,
      availableBalance: newEntryForm.availableBalance ? parseFloat(newEntryForm.availableBalance) : null,
    };

    onAddEntry(created);
    setIsAddingNew(false);
    setNewEntryForm({
      bookingDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      description: '',
      type: 'credit',
      amount: '',
      availableBalance: '',
    });
  };

  return (
    <div id="statement-table-container" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex flex-wrap rounded-lg bg-slate-200/80 p-0.5 text-xs font-medium gap-0.5">
            <button
              id="filter-all-btn"
              onClick={() => onFilterChange('all')}
              className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                currentFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({entries.length})
            </button>
            <button
              id="filter-credits-btn"
              onClick={() => onFilterChange('credit')}
              className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                currentFilter === 'credit'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              Credits Only (+)
            </button>
            <button
              id="filter-debits-btn"
              onClick={() => onFilterChange('debit')}
              className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                currentFilter === 'debit'
                  ? 'bg-rose-600 text-white shadow-xs font-semibold'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              Debits Only (-)
            </button>
            <button
              id="filter-remittance-btn"
              onClick={() => onFilterChange('remittance')}
              className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                currentFilter === 'remittance'
                  ? 'bg-sky-600 text-white shadow-xs font-semibold'
                  : 'text-sky-700 hover:text-sky-900'
              }`}
            >
              Remittance (+)
            </button>
            <button
              id="filter-taptap-btn"
              onClick={() => onFilterChange('taptap')}
              className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                currentFilter === 'taptap'
                  ? 'bg-amber-600 text-white shadow-xs font-semibold'
                  : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              Taptap (+)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="search-transactions-input"
              placeholder="Search description, date, amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#681c5a] focus:ring-1 focus:ring-[#681c5a]"
            />
          </div>

          <button
            id="add-entry-btn"
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#581c53] text-white rounded-lg hover:bg-[#461541] transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Entry
          </button>

          <button
            id="export-csv-btn"
            onClick={onExportCsv}
            title="Export to CSV"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export
          </button>
        </div>
      </div>

      {/* Inline Add Form */}
      {isAddingNew && (
        <form onSubmit={handleCreateNew} className="p-3.5 bg-purple-50/50 border-b border-purple-200">
          <div className="text-xs font-semibold text-[#581c53] mb-2.5">Add Transaction Entry</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">Booking Date</label>
              <input
                type="text"
                placeholder="21 Jan 2026"
                value={newEntryForm.bookingDate}
                onChange={(e) => setNewEntryForm({ ...newEntryForm, bookingDate: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] text-slate-600 mb-0.5">Description</label>
              <input
                type="text"
                placeholder="e.g. Raast P2P Transfer / POS Transaction"
                value={newEntryForm.description}
                onChange={(e) => setNewEntryForm({ ...newEntryForm, description: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">Column Type</label>
              <select
                value={newEntryForm.type}
                onChange={(e) => setNewEntryForm({ ...newEntryForm, type: e.target.value as 'credit' | 'debit' })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
              >
                <option value="credit">Credit (+ Green)</option>
                <option value="debit">Debit (- Red)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">Amount (PKR)</label>
              <input
                type="number"
                step="0.01"
                placeholder="1000.00"
                value={newEntryForm.amount}
                onChange={(e) => setNewEntryForm({ ...newEntryForm, amount: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">Available Balance</label>
              <input
                type="number"
                step="0.01"
                placeholder="Optional"
                value={newEntryForm.availableBalance}
                onChange={(e) => setNewEntryForm({ ...newEntryForm, availableBalance: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2.5">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1 text-xs text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1 text-xs font-medium text-white bg-[#581c53] rounded-md hover:bg-[#461541] cursor-pointer"
            >
              Save Entry
            </button>
          </div>
        </form>
      )}

      {/* Statement Table formatted in Meezan Bank styling */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          {/* Meezan Purple Header */}
          <thead>
            <tr className="bg-[#581c53] text-white select-none">
              <th className="py-2.5 px-3.5 font-semibold tracking-wide w-28">Booking Date</th>
              <th className="py-2.5 px-3.5 font-semibold tracking-wide min-w-[220px]">Description</th>
              <th className="py-2.5 px-3.5 font-semibold tracking-wide text-right w-36">
                <span className="inline-flex items-center justify-end gap-1">
                  Credit (+)
                </span>
              </th>
              <th className="py-2.5 px-3.5 font-semibold tracking-wide text-right w-36">
                <span className="inline-flex items-center justify-end gap-1">
                  Debit (-)
                </span>
              </th>
              <th className="py-2.5 px-3.5 font-semibold tracking-wide text-right w-36">Available Balance</th>
              <th className="py-2.5 px-3.5 font-semibold tracking-wide text-center w-16">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No statement transactions found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry, idx) => {
                const isEditing = editingId === entry.id;

                if (isEditing && editForm) {
                  return (
                    <tr key={entry.id} className="bg-amber-50/60">
                      <td className="p-2">
                        <input
                          type="text"
                          value={editForm.bookingDate}
                          onChange={(e) => setEditForm({ ...editForm, bookingDate: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                        />
                      </td>
                      <td className="p-2 text-right">
                        {editForm.type === 'credit' ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                            className="w-28 px-2 py-1 bg-white border border-emerald-400 text-emerald-700 font-bold rounded text-xs text-right"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, type: 'credit' })}
                            className="text-[11px] text-slate-400 hover:text-emerald-600 underline"
                          >
                            Set as Credit
                          </button>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        {editForm.type === 'debit' ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                            className="w-28 px-2 py-1 bg-white border border-rose-400 text-rose-700 font-bold rounded text-xs text-right"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, type: 'debit' })}
                            className="text-[11px] text-slate-400 hover:text-rose-600 underline"
                          >
                            Set as Debit
                          </button>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.availableBalance || ''}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              availableBalance: e.target.value ? parseFloat(e.target.value) : null,
                            })
                          }
                          className="w-28 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-right"
                          placeholder="Balance"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={saveEdit}
                            title="Save"
                            className="p-1 text-emerald-600 hover:bg-emerald-100 rounded cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            title="Cancel"
                            className="p-1 text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={entry.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                    }`}
                  >
                    {/* Booking Date */}
                    <td className="py-3 px-3.5 text-slate-800 font-medium whitespace-nowrap align-top">
                      {entry.bookingDate}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-3.5 text-slate-700 align-top leading-relaxed">
                      <div className="font-normal break-words max-w-xl">{entry.description}</div>
                      {entry.pageNumber && (
                        <div className="text-[10px] text-slate-400 mt-0.5">Page {entry.pageNumber}</div>
                      )}
                    </td>

                    {/* Credit column: + sign, Green color */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap align-top">
                      {entry.type === 'credit' ? (
                        <span className="text-emerald-600 font-bold tracking-tight">
                          + PKR{formatPKR(entry.amount)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Debit column: - sign, Red color */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap align-top">
                      {entry.type === 'debit' ? (
                        <span className="text-rose-600 font-bold tracking-tight">
                          - PKR{formatPKR(entry.amount)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Available Balance */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap text-slate-700 font-medium align-top">
                      {entry.availableBalance !== null && entry.availableBalance !== undefined ? (
                        `PKR${formatPKR(entry.availableBalance)}`
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-3.5 text-center align-top whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => startEdit(entry)}
                          title="Edit transaction"
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          title="Delete transaction"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer with Totals */}
          {entries.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-800">
                <td colSpan={2} className="py-3 px-3.5 text-right uppercase tracking-wider text-xs">
                  Summary Totals:
                </td>
                <td className="py-3 px-3.5 text-right text-emerald-700 font-black text-sm whitespace-nowrap">
                  + PKR{' '}
                  {formatPKR(
                    entries.filter((e) => e.type === 'credit').reduce((acc, curr) => acc + curr.amount, 0)
                  )}
                </td>
                <td className="py-3 px-3.5 text-right text-rose-700 font-black text-sm whitespace-nowrap">
                  - PKR{' '}
                  {formatPKR(
                    entries.filter((e) => e.type === 'debit').reduce((acc, curr) => acc + curr.amount, 0)
                  )}
                </td>
                <td colSpan={2} className="py-3 px-3.5 text-right text-xs text-slate-600">
                  {entries.length} transactions
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

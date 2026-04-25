'use client';

import { useEffect, useState } from 'react';

type Category = {
  id: number;
  name: string;
  type: string;
  color: string;
  icon: string | null;
};

type TransactionLine = {
  id: number;
  categoryId: number;
  amount: number;
  notes: string | null;
};

type Transaction = {
  id: number;
  description: string;
  totalAmount: number;
  date: string;
  notes: string | null;
  lines: TransactionLine[];
};

type NewLine = {
  categoryId: number;
  amount: number;
  notes: string;
};

export default function TransactionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<NewLine[]>([
    { categoryId: 0, amount: 0, notes: '' }
  ]);

  // editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editTotalAmount, setEditTotalAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLines, setEditLines] = useState<NewLine[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, transactionsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/transactions'),
        ]);
        
        const categoriesData = await categoriesRes.json();
        const transactionsData = await transactionsRes.json();
        
        setCategories(categoriesData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  const lineSum = lines.reduce((sum, line) => sum + line.amount, 0);
  const total = Number(totalAmount) || 0;
  const allLinesValid = lines.every(line => line.categoryId > 0 && line.amount > 0);
  const isValid = lineSum === total && total > 0 && description.trim() && allLinesValid;

  // Calculate validation for edit form
  const editLineSum = editLines.reduce((sum, line) => sum + line.amount, 0);
  const editTotal = Number(editTotalAmount) || 0;
  const editAllLinesValid = editLines.every(line => line.categoryId > 0 && line.amount > 0);
  const isEditValid = editLineSum === editTotal && editTotal > 0 && editDescription.trim() && editAllLinesValid;

  const addLine = () => {
    setLines([...lines, { categoryId: 0, amount: 0, notes: '' }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof NewLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const addEditLine = () => {
    setEditLines([...editLines, { categoryId: 0, amount: 0, notes: '' }]);
  };

  const removeEditLine = (index: number) => {
    setEditLines(editLines.filter((_, i) => i !== index));
  };

  const updateEditLine = (index: number, field: keyof NewLine, value: any) => {
    const newLines = [...editLines];
    newLines[index] = { ...newLines[index], [field]: value };
    setEditLines(newLines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    const payload = {
      description,
      totalAmount: Math.round(total * 100),
      notes,
      lines: lines.map(line => ({
        categoryId: line.categoryId,
        amount: Math.round(line.amount * 100),
        notes: line.notes || undefined,
      })),
    };

  const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      setTransactions([data.transaction, ...transactions]);
      
      setDescription('');
      setTotalAmount('');
      setNotes('');
      setLines([{ categoryId: 0, amount: 0, notes: '' }]);
    } else {
      const error = await res.json();
      console.error('API Error:', error);
      alert(`Error: ${JSON.stringify(error)}`);
    }
  };

  const startEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditDescription(transaction.description);
    setEditTotalAmount((transaction.totalAmount / 100).toString());
    setEditNotes(transaction.notes || '');
    setEditLines(
      transaction.lines.map(line => ({
        categoryId: line.categoryId,
        amount: line.amount / 100,
        notes: line.notes || '',
      }))
    );
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditValid || !editingId) return;

    const payload = {
      id: editingId,
      description: editDescription,
      totalAmount: Math.round(editTotal * 100),
      notes: editNotes,
      lines: editLines.map(line => ({
        categoryId: line.categoryId,
        amount: Math.round(line.amount * 100),
        notes: line.notes || undefined,
      })),
    };

  const res = await fetch('/api/transactions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      setTransactions(
        transactions.map(t =>
          t.id === editingId ? data.transaction : t
        )
      );
      setEditingId(null);
    } else {
      const error = await res.json();
      console.error('API Error:', error);
      alert(`Error: ${JSON.stringify(error)}`);
    }
  };

  const deleteTransaction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    const res = await fetch('/api/transactions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const getCategoryById = (id: number) => {
    return categories.find(c => c.id === id);
  };

  return (
    <main className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Transactions</h1>

      {/* Add Transaction Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., Target, Paycheck, Gas Station"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Total Amount ($)</label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded px-3 py-2"
              placeholder="100.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Split by Category</h3>
              <button
                type="button"
                onClick={addLine}
                className="text-blue-600 text-sm hover:underline"
              >
                + Add Line
              </button>
            </div>

            {lines.map((line, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  className={`flex-1 border rounded px-3 py-2 ${line.categoryId === 0 ? 'border-red-300 bg-red-50' : ''}`}
                  value={line.categoryId}
                  onChange={(e) => updateLine(index, 'categoryId', Number(e.target.value))}
                  required
                >
                  <option value={0}>Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.01"
                  className={`w-32 border rounded px-3 py-2 ${line.amount <= 0 ? 'border-red-300 bg-red-50' : ''}`}
                  placeholder="Amount"
                  value={line.amount || ''}
                  onChange={(e) => updateLine(index, 'amount', Number(e.target.value))}
                  required
                />

                <input
                  type="text"
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="Note (optional)"
                  value={line.notes}
                  onChange={(e) => updateLine(index, 'notes', e.target.value)}
                />

                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="text-red-600 px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <div className="mt-2 text-sm">
              <span className={lineSum === total && total > 0 ? 'text-green-600' : 'text-red-600'}>
                Line sum: ${(lineSum).toFixed(2)} / Total: ${(total).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add Transaction
          </button>
        </form>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">All Transactions</h2>
        
        {transactions.length === 0 ? (
          <p className="text-gray-500">No transactions yet. Add your first one above!</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              if (!transaction || !transaction.id) return null;
              
              // Editing mode
              if (editingId === transaction.id) {
                return (
                  <div key={transaction.id} className="border-2 border-blue-400 rounded p-4 bg-blue-50">
                    <h3 className="font-semibold mb-4">Edit Transaction</h3>
                    <form onSubmit={handleEditSubmit}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Total Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full border rounded px-3 py-2"
                          value={editTotalAmount}
                          onChange={(e) => setEditTotalAmount(e.target.value)}
                          required
                        />
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                        />
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">Split by Category</h4>
                          <button
                            type="button"
                            onClick={addEditLine}
                            className="text-blue-600 text-sm hover:underline"
                          >
                            + Add Line
                          </button>
                        </div>

                        {editLines.map((line, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <select
                              className={`flex-1 border rounded px-3 py-2 ${line.categoryId === 0 ? 'border-red-300 bg-red-50' : ''}`}
                              value={line.categoryId}
                              onChange={(e) => updateEditLine(index, 'categoryId', Number(e.target.value))}
                              required
                            >
                              <option value={0}>Select category...</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.icon} {cat.name}
                                </option>
                              ))}
                            </select>

                            <input
                              type="number"
                              step="0.01"
                              className={`w-32 border rounded px-3 py-2 ${line.amount <= 0 ? 'border-red-300 bg-red-50' : ''}`}
                              placeholder="Amount"
                              value={line.amount || ''}
                              onChange={(e) => updateEditLine(index, 'amount', Number(e.target.value))}
                              required
                            />

                            <input
                              type="text"
                              className="flex-1 border rounded px-3 py-2"
                              placeholder="Note (optional)"
                              value={line.notes}
                              onChange={(e) => updateEditLine(index, 'notes', e.target.value)}
                            />

                            {editLines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeEditLine(index)}
                                className="text-red-600 px-2"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}

                        <div className="mt-2 text-sm">
                          <span className={editLineSum === editTotal && editTotal > 0 ? 'text-green-600' : 'text-red-600'}>
                            Line sum: ${(editLineSum).toFixed(2)} / Total: ${(editTotal).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={!isEditValid}
                          className="flex-1 bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="flex-1 bg-gray-400 text-white py-2 rounded font-medium hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                );
              }

              // Normal mode
              return (
                <div key={transaction.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{transaction.description}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        ${((transaction.totalAmount || 0) / 100).toFixed(2)}
                      </p>
                      <button
                          onClick={() => startEdit(transaction)}
                          className="text-blue-600 text-sm hover:underline"
                        >
                          Edit
                       </button>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="text-red-600 text-sm hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {transaction.notes && (
                    <p className="text-sm text-gray-600 mb-2">{transaction.notes}</p>
                  )}

                  <div className="mt-3 space-y-1">
                    {(transaction.lines || []).map((line) => {
                      const category = getCategoryById(line.categoryId);
                      if (!category) return null;
                      
                      return (
                        <div key={line.id} className="flex justify-between text-sm">
                          <span>
                            <span style={{ color: category.color }}>
                              {category.icon} {category.name}
                            </span>
                            {line.notes && (
                              <span className="text-gray-500 ml-2">({line.notes})</span>
                            )}
                          </span>
                          <span>${((line.amount || 0) / 100).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
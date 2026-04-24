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

  const deleteTransaction = async (id: number) => {
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
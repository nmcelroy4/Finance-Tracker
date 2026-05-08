'use client';

import BudgetTable from '@/components/BudgetTable';
import { useEffect, useState, useMemo } from 'react';
import { Category, Transaction, Budget } from '@/types';

export default function BudgetPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  useEffect(() => {
    setSelectedMonth(getCurrentMonth());
  }, []);

  // fetch data
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

  // Load budgets for selected month
  useEffect(() => {
    if (!selectedMonth) return;

    const loadBudgets = async () => {
      try {
        const res = await fetch(`/api/budget?monthYear=${selectedMonth}`);
        const data = await res.json();
        setBudgets(data);  // ← Changed from setbudget
      } catch (error) {
        console.error('Failed to load budget:', error);
      }
    };

    loadBudgets();
  }, [selectedMonth]);

  // Calculate spending by category for selected month
  const categorySpending = useMemo(() => {
    const spending: Record<number, number> = {};

    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;

      if (transactionMonth === selectedMonth) {
        transaction.lines.forEach((line) => {
          const category = categories.find(c => c.id === line.categoryId);
          if (category?.type === 'expense') {
            spending[line.categoryId] = (spending[line.categoryId] || 0) + line.amount;
          }
        });
      }
    });

    return spending;
  }, [transactions, categories, selectedMonth]);

  // Get expense categories only
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleSetBudget = async (categoryId: number, amount: string) => {
    if (!amount || Number(amount) <= 0) return;

    const res = await fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId,
        monthYear: selectedMonth,
        limit: Math.round(Number(amount) * 100),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setBudgets(
        budgets.some(b => b.categoryId === categoryId)
          ? budgets.map(b => b.categoryId === categoryId ? data.budget : b)
          : [...budgets, data.budget]
      );
      setEditingBudgetId(null);
      setEditAmount('');
    }
  };

  const handleDeleteBudget = async (id: number) => {
    const res = await fetch('/api/budget', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setBudgets(budgets.filter(b => b.id !== id));
    }
  };

  const getBudgetForCategory = (categoryId: number) => {
    return budgets.find(b => b.categoryId === categoryId);
  };

  const getSpendingForCategory = (categoryId: number) => {
    return categorySpending[categoryId] || 0;
  };

    return (
    <main className="max-w-6xl mx-auto p-8">
        <header className="flex center">
            <h1 className="text-3xl font-bold mb-8">Budget</h1>
            <label className="block text-sm font-medium mb-2">Select Month</label>
            <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border rounded px-3 py-2"
            />
        </header>
        

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-700 font-medium">Total Budgeted</p>
          <p className="text-3xl font-bold text-blue-900">
            ${(budgets.reduce((sum, b) => sum + b.limit, 0) / 100).toFixed(2)}
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <p className="text-sm text-orange-700 font-medium">Total Spent</p>
          <p className="text-3xl font-bold text-orange-900">
            ${(Object.values(categorySpending).reduce((a, b) => a + b, 0) / 100).toFixed(2)}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-sm text-green-700 font-medium">Remaining</p>
          <p className="text-3xl font-bold text-green-900">
            ${(
              (budgets.reduce((sum, b) => sum + b.limit, 0) - Object.values(categorySpending).reduce((a, b) => a + b, 0)) / 100 
            ).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Budget Table */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Budget Overview</h2>
        <BudgetTable
          budgets={budgets} 
          categories={categories}
          categorySpending={categorySpending}
        />
      </div>

      {/* Budget Tracking */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Budget Tracking by Category</h2>

        <div className="space-y-6">
          {expenseCategories.map((category) => {
            const budgetItem = getBudgetForCategory(category.id); 
            const spending = getSpendingForCategory(category.id);
            const budgetLimit = budgetItem?.limit || 0;  // ← Changed from budget?.limit
            const percentage = budgetLimit > 0 ? (spending / budgetLimit) * 100 : 0;
            const isOverBudget = spending > budgetLimit && budgetLimit > 0;

            return (
              <div key={category.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="font-semibold">{category.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${(spending / 100).toFixed(2)}
                      {budgetLimit > 0 && (
                        <span className="text-gray-500 font-normal">
                          {' '}/ ${(budgetLimit / 100).toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Edit Budget */}
                {editingBudgetId === category.id ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 border rounded px-3 py-2"
                      placeholder="Budget limit"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                    />
                    <button
                      onClick={() => handleSetBudget(category.id, editAmount)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingBudgetId(null);
                        setEditAmount('');
                      }}
                      className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingBudgetId(category.id);
                        setEditAmount((budgetLimit / 100).toString());
                      }}
                      className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
                    >
                      {budgetLimit > 0 ? 'Edit Budget' : 'Set Budget'}
                    </button>
                    {budgetLimit > 0 && (
                      <button
                        onClick={() => handleDeleteBudget(budgetItem!.id)}
                        className="bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
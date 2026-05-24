'use client';

import BudgetTable from '@/app/budget/BudgetTable';
import { useEffect, useState, useMemo } from 'react';
import { Category, Transaction, Budget } from '@/types';
import { Button } from '@/components/ui/Button';
import { FunnelPlus } from 'lucide-react';
import AddLineModal from './AddLineModal';


export default function BudgetPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetLine, setBudgetLine] = useState<Budget[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [addLine, setAddLine] = useState<boolean>(false)

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

  useEffect(() => {
    if (!selectedMonth) return;

    const loadBudgets = async () => {
      try {
        const res = await fetch(`/api/budget?monthYear=${selectedMonth}`);
        const data = await res.json();
        setBudgetLine(data);
      } catch (error) {
        console.error('Failed to load budget:', error);
      }
    };

    loadBudgets();
  }, [selectedMonth]);

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

  const handleSetBudgetLine = async (categoryId: number, amount: string) => {
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
      setBudgetLine(
        budgetLine.some(b => b.categoryId === categoryId)
          ? budgetLine.map(b => b.categoryId === categoryId ? data.budget : b)
          : [...budgetLine, data.budget]
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
      setBudgetLine(budgetLine.filter(b => b.id !== id));
    }
  };

  const getBudgetForCategory = (categoryId: number) => {
    return budgetLine.find(b => b.categoryId === categoryId);
  };

  const getSpendingForCategory = (categoryId: number) => {
    return categorySpending[categoryId] || 0;
  };

    return (
    <main className="max-w-full mx-auto p-8">
        <header className="flex center">
            <h1 className="text-3xl font-bold mb-8">Budget</h1>
            <Button className="ml-2" variant="outline" size="icon" aria-label="filter">
                <FunnelPlus />
            </Button>
        </header>
        

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-700 font-medium">Total Budgeted</p>
          <p className="text-3xl font-bold text-blue-900">
            ${(budgetLine.reduce((sum, b) => sum + b.limit, 0) / 100).toFixed(2)}
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
              (budgetLine.reduce((sum, b) => sum + b.limit, 0) - Object.values(categorySpending).reduce((a, b) => a + b, 0)) / 100 
            ).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Budget Table */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className='flex justify-between'>
          <h2 className="text-xl font-semibold mb-6">Budget Overview</h2>
          <Button className='bg-blue-600' onClick={() => setAddLine(true)}>
            Add Line
          </Button>
        </div>
        
        {addLine && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <AddLineModal setAddLine={setAddLine}/>
          </div>
        )}
        
        <BudgetTable
          budgetLines={budgetLine} 
          categories={categories}
          categorySpending={categorySpending}
        />
      </div>
    </main>
  );
}
'use client';

import { useEffect, useState, useMemo } from 'react';
import Dashboard from '@/app/dashboard/Dashboard';
import { Category, Transaction, DashboardFilterRange } from '@/types';

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardFilterRange, setDashboardFilterRange] = useState<DashboardFilterRange>('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

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

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (dashboardFilterRange) {
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last-3-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return transactions;
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'all-time':
      default:
        return transactions;
    }

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }, [transactions, dashboardFilterRange, customStartDate, customEndDate]);

  const getDateRangeText = () => {
    const now = new Date();
    switch (dashboardFilterRange) {
      case 'this-month':
        return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'last-month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'last-3-months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return `${threeMonthsAgo.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
      case 'custom':
        if (!customStartDate || !customEndDate) return 'Select dates';
        return `${new Date(customStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(customEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'all-time':
      default:
        return 'All Time';
    }
  };

  return (
    <main className="max-w-full mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <h3 className="font-semibold text-gray-700">Time Period:</h3>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDashboardFilterRange('this-month')}
              className={`px-4 py-2 rounded font-medium transition ${
                dashboardFilterRange === 'this-month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
            
            <button
              onClick={() => setDashboardFilterRange('last-month')}
              className={`px-4 py-2 rounded font-medium transition ${
                dashboardFilterRange === 'last-month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Month
            </button>
            
            <button
              onClick={() => setDashboardFilterRange('last-3-months')}
              className={`px-4 py-2 rounded font-medium transition ${
                dashboardFilterRange === 'last-3-months'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 3 Months
            </button>
            
            <button
              onClick={() => setDashboardFilterRange('all-time')}
              className={`px-4 py-2 rounded font-medium transition ${
                dashboardFilterRange === 'all-time'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
            
            <button
              onClick={() => setDashboardFilterRange('custom')}
              className={`px-4 py-2 rounded font-medium transition ${
                dashboardFilterRange === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>

          {dashboardFilterRange === 'custom' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
          )}
        </div>

        <p className="mt-3 text-sm text-gray-600">
          Showing: <span className="font-semibold">{getDateRangeText()}</span>
          {' '}
          ({filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''})
        </p>
      </div>

      {/* Dashboard */}
      <Dashboard transactions={filteredTransactions} categories={categories} />
    </main>
  );
}
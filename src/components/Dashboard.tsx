'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

type DashboardProps = {
  transactions: Transaction[];
  categories: Category[];
};

export default function Dashboard({ transactions, categories }: DashboardProps) {
  // Calculate summary stats
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals: Record<number, number> = {};

    transactions.forEach((transaction) => {
      transaction.lines.forEach((line) => {
        const category = categories.find(c => c.id === line.categoryId);
        
        if (category?.type === 'income') {
          totalIncome += line.amount;
        } else {
          totalExpenses += line.amount;
        }

        // Track by category
        categoryTotals[line.categoryId] = (categoryTotals[line.categoryId] || 0) + line.amount;
      });
    });

    return {
      totalIncome,
      totalExpenses,
      netCashFlow: totalIncome - totalExpenses,
      categoryTotals,
    };
  }, [transactions, categories]);

  // Prepare data for category pie chart (expenses only)
  const categoryChartData = useMemo(() => {
    return Object.entries(stats.categoryTotals)
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === Number(categoryId));
        if (category?.type !== 'expense') return null;
        
        return {
          name: category.name,
          value: amount / 100, // Convert cents to dollars
          color: category.color,
          icon: category.icon,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.value || 0) - (a?.value || 0)); // Sort by amount descending
  }, [stats, categories]);

  // Top 5 spending categories
  const topCategories = categoryChartData.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-sm text-green-700 font-medium">Total Income</p>
          <p className="text-3xl font-bold text-green-900">
            ${(stats.totalIncome / 100).toFixed(2)}
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-sm text-red-700 font-medium">Total Expenses</p>
          <p className="text-3xl font-bold text-red-900">
            ${(stats.totalExpenses / 100).toFixed(2)}
          </p>
        </div>

        <div className={`${stats.netCashFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-6`}>
          <p className={`text-sm font-medium ${stats.netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            Net Cash Flow
          </p>
          <p className={`text-3xl font-bold ${stats.netCashFlow >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
            {stats.netCashFlow >= 0 ? '+' : '-'}${Math.abs(stats.netCashFlow / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category - Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
          
          {categoryChartData.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No expense data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry?.color || '#888'} />
                  ))}
                </Pie>
                <Tooltip 
                    formatter={(value) => `$${Number(value || 0).toFixed(2)}`} 
                    contentStyle={{ fontSize: '14px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top 5 Categories - Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top 5 Spending Categories</h3>
          
          {topCategories.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No expense data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCategories}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                    formatter={(value) => `$${Number(value || 0).toFixed(2)}`}
                    contentStyle={{ fontSize: '14px' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry?.color || '#888'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Breakdown List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">All Categories Breakdown</h3>
        
        {categoryChartData.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No data yet</p>
        ) : (
          <div className="space-y-2">
            {categoryChartData.map((item, index) => {
              if (!item) return null;
              const percentage = ((item.value / (stats.totalExpenses / 100)) * 100).toFixed(1);
              
              return (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium">
                      {item.icon} {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${item.value.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{percentage}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import InfoTile from './InfoTile';
import GoalsTile from './GoalsTile';
import NetWorthTile from './NetWorthTile';

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
        <InfoTile title="Income" total={(stats.totalIncome / 100).toFixed(2)}/>
        <InfoTile title="Expenses" total={(stats.totalExpenses / 100).toFixed(2)}/>
        <InfoTile title="Net Cashflow" total={(stats.netCashFlow / 100).toFixed(2)}/>
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

        <GoalsTile />
      </div>

      {/* Category Breakdown List */}
      <div className="bg-white rounded-lg shadow p-6">
       <NetWorthTile />
      </div>
    </div>
  );
}
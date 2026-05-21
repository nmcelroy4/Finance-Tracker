'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Budget, Category } from '@/types';

type BudgetTableProps = {
  budgets: Budget[];
  categories: Category[];
  categorySpending: Record<number, number>;
};

export default function BudgetTable({ budgets, categories, categorySpending }: BudgetTableProps) {
  const getCategoryName = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const getSpending = (categoryId: number) => {
    return categorySpending[categoryId] || 0;
  };

  const isOverBudget = (categoryId: number, limitAmount: number) => {
    const spending = getSpending(categoryId);
    return spending > limitAmount;
  };

  const getStatus = (categoryId: number, limitAmount: number) => {
    const spending = getSpending(categoryId);
    if (spending === 0) return 'No spending';
    if (isOverBudget(categoryId, limitAmount)) return 'Over budget';
    return 'On track';
  };

  const getPercentage = (categoryId: number, limitAmount: number) => {
    const spending = getSpending(categoryId);
    return limitAmount > 0 ? Math.round((spending / limitAmount) * 100) : 0;
  };

  return (
    <Table>
      <TableCaption>Budget overview for all categories</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Budget Limit</TableHead>
          <TableHead>Spent</TableHead>
          <TableHead>Remaining</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Progress</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {budgets.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-gray-500">
              No budget set yet
            </TableCell>
          </TableRow>
        ) : (
          budgets.map((budgets) => {
            const spending = getSpending(budgets.categoryId);
            const remaining = budgets.limit - spending;
            const status = getStatus(budgets.categoryId, budgets.limit);
            const percentage = getPercentage(budgets.categoryId, budgets.limit);
            const over = isOverBudget(budgets.categoryId, budgets.limit);

            return (
              <TableRow key={budgets.id} className={over ? 'bg-red-50' : ''}>
                <TableCell className="font-medium">
                  {getCategoryName(budgets.categoryId)}
                </TableCell>
                <TableCell>${(budgets.limit / 100).toFixed(2)}</TableCell>
                <TableCell>${(spending / 100).toFixed(2)}</TableCell>
                <TableCell className={over ? 'text-red-600 font-semibold' : ''}>
                  ${(remaining / 100).toFixed(2)}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-sm ${
                    over 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${over ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{percentage}%</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
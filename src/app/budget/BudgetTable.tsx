'use client';

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
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
import { useState } from "react";

type BudgetTableProps = {
  budgetLines: Budget[]
  categories: Category[]
  categorySpending: Record<number, number>
  deleteLine: boolean
  setDeleteLine: (value: boolean) => void
  onBudgetDeleted?: (ids: number[]) => void
};

export default function BudgetTable({ budgetLines, categories, categorySpending, deleteLine, setDeleteLine, onBudgetDeleted }: BudgetTableProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  
  const getCategoryName = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown'
  };

  const getSpending = (categoryId: number) => {
    return categorySpending[categoryId] || 0
  };

  const isOverBudget = (categoryId: number, limitAmount: number) => {
    const spending = getSpending(categoryId)
    return spending > limitAmount
  };

  const getStatus = (categoryId: number, limitAmount: number) => {
    const spending = getSpending(categoryId)
    if (spending === 0) return 'No spending'
    if (isOverBudget(categoryId, limitAmount)) return 'Over budget'
    return 'On track'
  };

  const getPercentage = (categoryId: number, limitAmount: number) => {
    const spending = getSpending(categoryId)
    return limitAmount > 0 ? Math.round((spending / limitAmount) * 100) : 0
  };

  const toggleRow = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === budgetLines.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(budgetLines.map(b => b.id))
    }
  }

  const handleDelete = async () => {
    try {
      for (const id of selectedIds) {
        const res = await fetch('/api/budget', { 
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        if (!res.ok) {
          const error = await res.json()
          console.error(`Failed to delete budget ${id}:`, error)
        }
      }
      onBudgetDeleted?.(selectedIds)  // Call parent callback
      setSelectedIds([])
      setDeleteLine(false)
    } catch (error) {
      console.error('Error deleting budgets:', error)
    }
  };

  return (
    <>
      {deleteLine && selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm">{selectedIds.length} selected</span>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDelete}
          >
            Delete Selected
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedIds([])}
          >
            Clear Selection
          </Button>
        </div>
      )}
      
      <Table>
        <TableCaption>Budget overview for all categories</TableCaption>
        <TableHeader>
          <TableRow>
            {deleteLine && <TableHead className="w-12"></TableHead>}
            <TableHead>Category</TableHead>
            <TableHead>Budget Limit</TableHead>
            <TableHead>Spent</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgetLines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={deleteLine ? 7 : 6} className="text-center text-gray-500">
                No budget set yet
              </TableCell>
            </TableRow>
          ) : (
            budgetLines.map((budgets) => {
              const spending = getSpending(budgets.categoryId)
              const remaining = budgets.limit - spending
              const status = getStatus(budgets.categoryId, budgets.limit)
              const percentage = getPercentage(budgets.categoryId, budgets.limit)
              const over = isOverBudget(budgets.categoryId, budgets.limit)

              return (
                <TableRow key={budgets.id} className={over ? 'bg-red-50' : ''}>
                  {deleteLine && (
                    <TableCell className="w-12">
                      <Checkbox
                        checked={selectedIds.includes(budgets.id)}
                        onCheckedChange={() => toggleRow(budgets.id)}
                      />
                    </TableCell>
                  )}
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
    </>
  );
}
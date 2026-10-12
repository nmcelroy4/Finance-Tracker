"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Budget, Category, Transaction } from "@/types";

const transactionCalendarDate = (value: string) =>
	new Date(value).toISOString().slice(0, 10);

const formatTransactionDate = (value: string) =>
	new Date(value).toLocaleDateString("en-US", { timeZone: "UTC" });

type BudgetTableProps = {
	budgetLines: Budget[];
	categories: Category[];
	transactions: Transaction[];
	monthYear: string;
	categorySpending: Record<number, number>;
	deleteLine: boolean;
	setDeleteLine: (value: boolean) => void;
	onBudgetDeleted?: (ids: number[]) => void;
	onBudgetUpdated?: (id: number, newLimit: number) => void;
};

export default function BudgetTable({
	budgetLines,
	categories,
	transactions,
	monthYear,
	categorySpending,
	deleteLine,
	setDeleteLine,
	onBudgetDeleted,
	onBudgetUpdated,
}: BudgetTableProps) {
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editValue, setEditValue] = useState<string>("");
	const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
	const [transactionSearch, setTransactionSearch] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const hasInvalidDateRange = Boolean(
		startDate && endDate && startDate > endDate,
	);

	const getCategoryName = (categoryId: number) => {
		return categories.find((c) => c.id === categoryId)?.name || "Unknown";
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
		if (spending === 0) return "No spending";
		if (isOverBudget(categoryId, limitAmount)) return "Over budget";
		return "On track";
	};

	const getPercentage = (categoryId: number, limitAmount: number) => {
		const spending = getSpending(categoryId);
		return limitAmount > 0 ? Math.round((spending / limitAmount) * 100) : 0;
	};

	const toggleRow = (id: number) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
		);
	};

	const handleDelete = async () => {
		try {
			for (const id of selectedIds) {
				const res = await fetch("/api/budget", {
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ id }),
				});
				if (!res.ok) {
					const error = await res.json();
					console.error(`Failed to delete budget ${id}:`, error);
				}
			}
			onBudgetDeleted?.(selectedIds); // Call parent callback
			setSelectedIds([]);
			setDeleteLine(false);
		} catch (error) {
			console.error("Error deleting budgets:", error);
		}
	};

	const startEdit = (id: number, currentLimit: number) => {
		
		setEditingId(id);
		setEditValue((currentLimit / 100).toFixed(2));
	};

	const saveEdit = async (id: number) => {
		if (!editValue) return;

		const res = await fetch("/api/budget", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				id,
				limit: Math.round(Number(editValue) * 100),
			}),
		});

		if (res.ok) {
			const data = await res.json();
			onBudgetUpdated?.(id, data.budget.limit);
			setEditingId(null);
			setEditValue("");
		}
	};

	const cancelEdit = () => {
		setEditingId(null);
		setEditValue("");
	};

	const openTransactionModal = (budget: Budget) => {
		setSelectedBudget(budget);
		setTransactionSearch("");
		setStartDate("");
		setEndDate("");
	};

	const closeTransactionModal = () => {
		setSelectedBudget(null);
		setTransactionSearch("");
		setStartDate("");
		setEndDate("");
	};

	const selectedCategory = selectedBudget
		? categories.find((category) => category.id === selectedBudget.categoryId)
		: null;
	const categoryTransactions = selectedBudget
		? transactions
				.filter((transaction) => {
					const transactionDate = new Date(transaction.date);
					const transactionMonth = `${transactionDate.getUTCFullYear()}-${String(
						transactionDate.getUTCMonth() + 1,
					).padStart(2, "0")}`;
					return transactionMonth === monthYear;
				})
				.flatMap((transaction) =>
					transaction.lines
						.filter((line) => line.categoryId === selectedBudget.categoryId)
						.map((line) => ({ transaction, line })),
				)
				.sort((a, b) => b.transaction.date.localeCompare(a.transaction.date))
		: [];
	const filteredTransactions = categoryTransactions.filter(
		({ transaction }) => {
			if (hasInvalidDateRange) return false;
			const date = transactionCalendarDate(transaction.date);
			const matchesDescription = transaction.description
				.toLowerCase()
				.includes(transactionSearch.trim().toLowerCase());
			return (
				matchesDescription &&
				(!startDate || date >= startDate) &&
				(!endDate || date <= endDate) // Both endpoints are inclusive.
			);
		},
	);
	const filteredTotal = filteredTransactions.reduce(
		(sum, { line }) => sum + line.amount,
		0,
	);
	const formatMonth = new Date(`${monthYear}-02`).toLocaleDateString("en-US", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	});

	return (
		<>
			{deleteLine && selectedIds.length > 0 && (
				<div className="mb-4 flex items-center gap-2">
					<span className="text-sm">{selectedIds.length} selected</span>
					<Button variant="destructive" size="sm" onClick={handleDelete}>
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
							<TableCell
								colSpan={deleteLine ? 7 : 6}
								className="text-center text-gray-500"
							>
								No budget set yet
							</TableCell>
						</TableRow>
					) : (
						budgetLines.map((budgets) => {
							const spending = getSpending(budgets.categoryId);
							const remaining = budgets.limit - spending;
							const status = getStatus(budgets.categoryId, budgets.limit);
							const percentage = getPercentage(
								budgets.categoryId,
								budgets.limit,
							);
							const over = isOverBudget(budgets.categoryId, budgets.limit);
							const isEditing = editingId === budgets.id;

							return (
								<TableRow
									key={budgets.id}
									className={`cursor-pointer hover:bg-blue-50 ${over ? "bg-red-50 hover:bg-red-100" : ""}`}
									onClick={() => openTransactionModal(budgets)}
								>
									{deleteLine && (
										<TableCell
											className="w-12"
											onClick={(event) => event.stopPropagation()}
										>
											<Checkbox
												checked={selectedIds.includes(budgets.id)}
												onCheckedChange={() => toggleRow(budgets.id)}
											/>
										</TableCell>
									)}
									<TableCell className="font-medium">
										{getCategoryName(budgets.categoryId)}
									</TableCell>
									<TableCell
										onClick={(event) => isEditing && event.stopPropagation()}
									>
										{isEditing ? (
											<Input
												type="number"
												step="0.01"
												value={editValue}
												onChange={(e) => setEditValue(e.target.value)}
												className="w-24"
											/>
										) : (
											`$${(budgets.limit / 100).toFixed(2)}`
										)}
									</TableCell>
									<TableCell>${(spending / 100).toFixed(2)}</TableCell>
									<TableCell
										className={over ? "text-red-600 font-semibold" : ""}
									>
										${(remaining / 100).toFixed(2)}
									</TableCell>
									<TableCell>
										<span
											className={`px-2 py-1 rounded text-sm ${
												over
													? "bg-red-100 text-red-800"
													: "bg-green-100 text-green-800"
											}`}
										>
											{status}
										</span>
									</TableCell>
									<TableCell
										className="text-right"
										onClick={(event) => event.stopPropagation()}
									>
										<div className="flex items-center gap-2 justify-end">
											<div className="w-24 bg-gray-200 rounded-full h-2">
												<div
													className={`h-2 rounded-full ${over ? "bg-red-500" : "bg-green-500"}`}
													style={{ width: `${Math.min(percentage, 100)}%` }}
												/>
											</div>
											<span className="text-sm font-medium w-8">
												{percentage}%
											</span>
										</div>
									</TableCell>
									<TableCell 
										className="text-right" 
										onClick={(event) => event.stopPropagation()}
									>
										{isEditing ? (
											<div className="flex gap-1 justify-end">
												<Button
													size="sm"
													variant="outline"
													onClick={() => saveEdit(budgets.id)}
												>
													Save
												</Button>
												<Button
													size="sm"
													variant="outline"
													onClick={cancelEdit}
												>
													Cancel
												</Button>
											</div>
										) : (
											<Button
												size="sm"
												variant="outline"
												onClick={() => startEdit(budgets.id, budgets.limit)}
											>
												Edit
											</Button>
										)}
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>

			{selectedBudget && selectedCategory && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
						<div className="mb-5 flex items-start justify-between gap-4">
							<div>
								<h2 className="text-xl font-semibold">
									{selectedCategory.name} transactions
								</h2>
								<p className="text-sm text-gray-500">{formatMonth}</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={closeTransactionModal}
							>
								Close
							</Button>
						</div>

						<div className="mb-5 grid gap-3 sm:grid-cols-3">
							<div className="sm:col-span-3">
								<label
									htmlFor="category-transaction-search"
									className="mb-1 block text-sm font-medium"
								>
									Search description
								</label>
								<Input
									id="category-transaction-search"
									value={transactionSearch}
									onChange={(event) => setTransactionSearch(event.target.value)}
									placeholder="Search transactions..."
								/>
							</div>
							<div>
								<label
									htmlFor="category-transaction-start-date"
									className="mb-1 block text-sm font-medium"
								>
									From date
								</label>
								<Input
									id="category-transaction-start-date"
									type="date"
									value={startDate}
									max={endDate || undefined}
									aria-invalid={hasInvalidDateRange}
									className={hasInvalidDateRange ? "border-red-500" : undefined}
									onChange={(event) => setStartDate(event.target.value)}
								/>
							</div>
							<div>
								<label
									htmlFor="category-transaction-end-date"
									className="mb-1 block text-sm font-medium"
								>
									To date
								</label>
								<Input
									id="category-transaction-end-date"
									type="date"
									value={endDate}
									min={startDate || undefined}
									aria-invalid={hasInvalidDateRange}
									className={hasInvalidDateRange ? "border-red-500" : undefined}
									onChange={(event) => setEndDate(event.target.value)}
								/>
							</div>
							<div className="rounded-md bg-blue-50 px-3 py-2 text-sm">
								<div className="text-gray-600">Filtered total</div>
								<div className="text-lg font-semibold text-blue-900">
									${(filteredTotal / 100).toFixed(2)}
								</div>
								<div className="text-xs text-gray-500">
									{filteredTransactions.length} transaction
									{filteredTransactions.length === 1 ? "" : "s"}
								</div>
							</div>
							{hasInvalidDateRange && (
								<p className="sm:col-span-3 text-sm text-red-600">
									Start date must be on or before the end date.
								</p>
							)}
						</div>

						{filteredTransactions.length === 0 ? (
							<p className="py-8 text-center text-gray-500">
								No matching transactions in this category for {formatMonth}.
							</p>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Date</TableHead>
											<TableHead>Description</TableHead>
											<TableHead>Notes</TableHead>
											<TableHead className="text-right">Amount</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredTransactions.map(({ transaction, line }) => (
											<TableRow key={`${transaction.id}-${line.id}`}>
												<TableCell>
													{formatTransactionDate(transaction.date)}
												</TableCell>
												<TableCell className="font-medium">
													{transaction.description}
												</TableCell>
												<TableCell className="text-gray-600">
													{line.notes || transaction.notes || "—"}
												</TableCell>
												<TableCell className="text-right font-medium">
													${(line.amount / 100).toFixed(2)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}

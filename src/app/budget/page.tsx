"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import BudgetTable from "@/app/budget/BudgetTable";
import { Button } from "@/components/ui/Button";
import type { Budget, Category, Transaction } from "@/types";
import InfoTile from "../dashboard/InfoTile";
import AddLineModal from "./AddLineModal";

export default function BudgetPage() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [budgetLine, setBudgetLine] = useState<Budget[]>([]);
	const [addLine, setAddLine] = useState<boolean>(false);
	const [deleteLine, setDeleteLine] = useState<boolean>(false);
	const expenseCategories = categories.filter((c) => c.type === "expense");

	const getCurrentMonth = () => {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
	};

	const [selectedMonth, setSelectedMonth] = useState<string>(() =>
		getCurrentMonth(),
	);

	const getPrevMonth = (month: string) => {
		const [year, m] = month.split("-").map(Number);
		const d = new Date(year, m - 1);
		return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
	};

	const getNextMonth = (month: string) => {
		const [year, m] = month.split("-").map(Number);
		const d = new Date(year, m + 1);
		return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
	};

	const formatMonthLabel = (month: string) => {
		const [year, m] = month.split("-").map(Number);
		return new Date(year, m - 1).toLocaleDateString("en-US", {
			month: "long",
			year: "numeric",
		});
	};

	useEffect(() => {
		const loadData = async () => {
			try {
				const [categoriesRes, transactionsRes] = await Promise.all([
					fetch("/api/categories"),
					fetch("/api/transactions"),
				]);

				const categoriesData = await categoriesRes.json();
				const transactionsData = await transactionsRes.json();

				setCategories(categoriesData);
				setTransactions(transactionsData);
			} catch (error) {
				console.error("Failed to load data:", error);
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
				console.error("Failed to load budget:", error);
			}
		};

		loadBudgets();
	}, [selectedMonth]);

	const categorySpending = useMemo(() => {
		const spending: Record<number, number> = {};

		transactions.forEach((transaction) => {
			const transactionDate = new Date(transaction.date);
			const transactionMonth = `${transactionDate.getUTCFullYear()}-${String(transactionDate.getUTCMonth() + 1).padStart(2, "0")}`;

			if (transactionMonth === selectedMonth) {
				transaction.lines.forEach((line) => {
					const category = categories.find((c) => c.id === line.categoryId);
					if (category?.type === "expense") {
						spending[line.categoryId] =
							(spending[line.categoryId] || 0) + line.amount;
					}
				});
			}
		});

		return spending;
	}, [transactions, categories, selectedMonth]);

	return (
		<main className="max-w-full mx-auto p-8">
			<header className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-bold">Budget</h1>
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						onClick={() => setSelectedMonth(getPrevMonth(selectedMonth))}
						className="px-3 py-1 rounded border"
					>
						<ChevronLeft />
					</Button>
					<span className="text-lg font-medium text-center">
						{selectedMonth ? formatMonthLabel(selectedMonth) : ""}
					</span>
					<Button
						variant="ghost"
						onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
						className="px-3 py-1 rounded border"
					>
						<ChevronRight />
					</Button>
				</div>
			</header>

			{/* Budget Overview */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				<InfoTile
					title="Total Budgeted"
					total={(
						budgetLine.reduce((sum, b) => sum + b.limit, 0) / 100
					).toFixed(2)}
					variant="success"
				/>
				<InfoTile
					title="Total Spent"
					total={(
						Object.values(categorySpending).reduce((a, b) => a + b, 0) / 100
					).toFixed(2)}
					variant="danger"
				/>
				<InfoTile
					title="Monthly Burn Rate"
					total={(
						(budgetLine.reduce((sum, b) => sum + b.limit, 0) -
							Object.values(categorySpending).reduce((a, b) => a + b, 0)) /
						100
					).toFixed(2)}
				/>
			</div>

			{/* Budget Table */}
			<div className="bg-white rounded-lg shadow p-6 mb-8">
				<div className="flex justify-between">
					<h2 className="text-xl font-semibold mb-6">Budget Overview</h2>
					<div>
						<Button className="bg-blue-600" onClick={() => setAddLine(true)}>
							Add Line
						</Button>
						<Button
							className="bg-red-500"
							onClick={() => setDeleteLine((prev) => !prev)}
						>
							Delete Line
						</Button>
					</div>
				</div>

				{addLine && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
						<AddLineModal
							setAddLine={setAddLine}
							categories={expenseCategories}
							month={selectedMonth}
							budgetLine={budgetLine}
							setBudgetLine={setBudgetLine}
						/>
					</div>
				)}

				<BudgetTable
					budgetLines={budgetLine}
					categories={categories}
					categorySpending={categorySpending}
					deleteLine={deleteLine}
					setDeleteLine={setDeleteLine}
					onBudgetDeleted={(ids) =>
						setBudgetLine(budgetLine.filter((b) => !ids.includes(b.id)))
					}
					onBudgetUpdated={(id, newLimit) => {
						setBudgetLine(
							budgetLine.map((b) =>
								b.id === id ? { ...b, limit: newLimit } : b,
							),
						);
					}}
				/>
			</div>
		</main>
	);
}

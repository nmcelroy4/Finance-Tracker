import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { budget } from "../../../../drizzle/schema";

const budgetSchema = z.object({
	categoryId: z.number().int().positive(),
	monthYear: z.string().regex(/^\d{4}-\d{2}$/, "Format must be YYYY-MM"),
	limit: z.number().int().positive(),
});

const budgetIdSchema = z.object({
	id: z.number().int().positive(),
});

const budgetUpdateSchema = budgetIdSchema.extend({
	limit: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
	const body = await req.json();
	const result = budgetSchema.safeParse(body);

	if (!result.success) {
		return NextResponse.json({ error: result.error.errors }, { status: 400 });
	}

	const { categoryId, monthYear, limit } = result.data;

	try {
		const newBudget = await db
			.insert(budget)
			.values({ categoryId, monthYear, limit })
			.onConflictDoUpdate({
				target: [budget.categoryId, budget.monthYear],
				set: { limit },
			})
			.returning();

		return NextResponse.json({ success: true, budget: newBudget[0] });
	} catch (error) {
		console.error("Budget creation failed:", error);
		return NextResponse.json(
			{ error: "Failed to save budget" },
			{ status: 500 },
		);
	}
}

export async function GET(req: NextRequest) {
	const searchParams = req.nextUrl.searchParams;
	const monthYear = searchParams.get("monthYear");

	const result = z
		.string()
		.regex(/^\d{4}-\d{2}$/)
		.safeParse(monthYear);
	if (!result.success) {
		return NextResponse.json(
			{ error: "monthYear must use YYYY-MM format" },
			{ status: 400 },
		);
	}

	try {
		const monthBudgets = await db
			.select()
			.from(budget)
			.where(eq(budget.monthYear, result.data));

		return NextResponse.json(monthBudgets);
	} catch (error) {
		console.error("Budget fetch failed:", error);
		return NextResponse.json(
			{ error: "Failed to fetch budgets" },
			{ status: 500 },
		);
	}
}

export async function DELETE(req: NextRequest) {
	const result = budgetIdSchema.safeParse(await req.json());
	if (!result.success) {
		return NextResponse.json({ error: result.error.errors }, { status: 400 });
	}

	try {
		const deleted = await db
			.delete(budget)
			.where(eq(budget.id, result.data.id))
			.returning();
		if (deleted.length === 0) {
			return NextResponse.json({ error: "Budget not found" }, { status: 404 });
		}
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Budget deletion failed:", error);
		return NextResponse.json(
			{ error: "Failed to delete budget" },
			{ status: 500 },
		);
	}
}

export async function PUT(req: NextRequest) {
	const result = budgetUpdateSchema.safeParse(await req.json());
	if (!result.success) {
		return NextResponse.json({ error: result.error.errors }, { status: 400 });
	}
	const { id, limit } = result.data;

	try {
		const updated = await db
			.update(budget)
			.set({ limit })
			.where(eq(budget.id, id))
			.returning();

		if (updated.length === 0) {
			return NextResponse.json({ error: "Budget not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true, budget: updated[0] });
	} catch (error) {
		console.error("Budget update failed:", error);
		return NextResponse.json(
			{ error: "Failed to update budget" },
			{ status: 500 },
		);
	}
}

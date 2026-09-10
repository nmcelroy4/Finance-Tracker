import { eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { transactionLines, transactions } from "../../../../drizzle/schema";

// Validation schemas
const transactionLineSchema = z.object({
	categoryId: z.number().int().positive(),
	amount: z.number().int(), // Can be negative for refunds
	notes: z.string().optional(),
});

const createTransactionSchema = z.object({
	description: z.string().min(1),
	totalAmount: z.number().int(),
	date: z.string().datetime().optional(), // ISO date string
	notes: z.string().optional(),
	lines: z.array(transactionLineSchema).min(1), // Must have at least 1 line
});

const updateTransactionSchema = z.object({
	id: z.number().int().positive(),
	description: z.string().min(1),
	totalAmount: z.number().int(),
	date: z.string().datetime().optional(),
	notes: z.string().optional(),
	lines: z.array(transactionLineSchema).min(1),
});

// POST - Create new transaction with lines
export async function POST(req: NextRequest) {
	const body = await req.json();
	const result = createTransactionSchema.safeParse(body);

	if (!result.success) {
		return NextResponse.json({ error: result.error.errors }, { status: 400 });
	}

	const { description, totalAmount, date, notes, lines } = result.data;

	// Validate that line amounts sum to total
	const lineSum = lines.reduce((sum, line) => sum + line.amount, 0);
	if (lineSum !== totalAmount) {
		return NextResponse.json(
			{
				error: `Line items sum (${lineSum}) doesn't match total (${totalAmount})`,
			},
			{ status: 400 },
		);
	}

	try {
		const lineValues = sql.join(
			lines.map(
				(line) =>
					sql`(${line.categoryId}, ${line.amount}, ${line.notes ?? null})`,
			),
			sql`, `,
		);
		const created = await db.execute<{ id: number }>(sql`
			WITH new_transaction AS (
				INSERT INTO transactions (description, total_amount, date, notes)
				VALUES (${description}, ${totalAmount}, ${date ? new Date(date) : new Date()}, ${notes ?? null})
				RETURNING id
			), inserted_lines AS (
				INSERT INTO transaction_lines (transaction_id, category_id, amount, notes)
				SELECT new_transaction.id, line.category_id, line.amount, line.notes
				FROM new_transaction
				CROSS JOIN (VALUES ${lineValues}) AS line(category_id, amount, notes)
			)
			SELECT id FROM new_transaction
		`);
		const id = created.rows[0]?.id;
		if (!id) throw new Error("Transaction insert did not return an ID");

		const [newTransaction] = await db
			.select()
			.from(transactions)
			.where(eq(transactions.id, id));
		const newLines = await db
			.select()
			.from(transactionLines)
			.where(eq(transactionLines.transactionId, id));

		return NextResponse.json({
			success: true,
			transaction: {
				...newTransaction,
				lines: newLines,
			},
		});
	} catch (error) {
		console.error("Transaction creation failed:", error);
		return NextResponse.json(
			{ error: "Failed to create transaction" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	try {
		const allTransactions = await db.select().from(transactions);

		const transactionsWithLines = await Promise.all(
			allTransactions.map(async (transaction) => {
				const lines = await db
					.select()
					.from(transactionLines)
					.where(eq(transactionLines.transactionId, transaction.id));

				return {
					...transaction,
					lines,
				};
			}),
		);

		return NextResponse.json(transactionsWithLines);
	} catch (error) {
		console.error("Failed to fetch transactions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch transactions" },
			{ status: 500 },
		);
	}
}

export async function DELETE(req: NextRequest) {
	const result = z
		.object({ id: z.number().int().positive() })
		.safeParse(await req.json());
	if (!result.success) {
		return NextResponse.json({ error: result.error.errors }, { status: 400 });
	}

	try {
		const deleted = await db
			.delete(transactions)
			.where(eq(transactions.id, result.data.id))
			.returning();
		if (deleted.length === 0) {
			return NextResponse.json(
				{ error: "Transaction not found" },
				{ status: 404 },
			);
		}
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Transaction deletion failed:", error);
		return NextResponse.json(
			{ error: "Failed to delete transaction" },
			{ status: 500 },
		);
	}
}

export async function PUT(req: NextRequest) {
	const body = await req.json();
	const result = updateTransactionSchema.safeParse(body);

	if (!result.success) {
		return NextResponse.json({ error: result.error.errors }, { status: 400 });
	}

	const { id, description, totalAmount, date, notes, lines } = result.data;

	const lineSum = lines.reduce((sum, line) => sum + line.amount, 0);
	if (lineSum !== totalAmount) {
		return NextResponse.json(
			{
				error: `Line items sum (${lineSum}) doesn't match total (${totalAmount})`,
			},
			{ status: 400 },
		);
	}

	try {
		const lineValues = sql.join(
			lines.map(
				(line) =>
					sql`(${line.categoryId}, ${line.amount}, ${line.notes ?? null})`,
			),
			sql`, `,
		);
		const updates = date
			? sql`description = ${description}, total_amount = ${totalAmount}, date = ${new Date(date)}, notes = ${notes ?? null}`
			: sql`description = ${description}, total_amount = ${totalAmount}, notes = ${notes ?? null}`;
		const updated = await db.execute<{ id: number }>(sql`
			WITH updated_transaction AS (
				UPDATE transactions
				SET ${updates}
				WHERE id = ${id}
				RETURNING id
			), deleted_lines AS (
				DELETE FROM transaction_lines
				WHERE transaction_id = (SELECT id FROM updated_transaction)
			), inserted_lines AS (
				INSERT INTO transaction_lines (transaction_id, category_id, amount, notes)
				SELECT updated_transaction.id, line.category_id, line.amount, line.notes
				FROM updated_transaction
				CROSS JOIN (VALUES ${lineValues}) AS line(category_id, amount, notes)
			)
			SELECT id FROM updated_transaction
		`);
		if (!updated.rows[0]?.id) {
			return NextResponse.json(
				{ error: "Transaction not found" },
				{ status: 404 },
			);
		}
		const [updatedTransaction] = await db
			.select()
			.from(transactions)
			.where(eq(transactions.id, id));
		const updatedLines = await db
			.select()
			.from(transactionLines)
			.where(eq(transactionLines.transactionId, id));

		return NextResponse.json({
			success: true,
			transaction: {
				...updatedTransaction,
				lines: updatedLines,
			},
		});
	} catch (error) {
		console.error("Transaction update failed:", error);
		return NextResponse.json(
			{ error: "Failed to update transaction" },
			{ status: 500 },
		);
	}
}

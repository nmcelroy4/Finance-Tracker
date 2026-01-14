import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, transactionLines } from '../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

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
      { error: `Line items sum (${lineSum}) doesn't match total (${totalAmount})` },
      { status: 400 }
    );
  }

  try {
    // Create transaction
    const [newTransaction] = await db.insert(transactions).values({
      description,
      totalAmount,
      date: date ? new Date(date) : new Date(),
      notes,
    }).returning();

    // Create line items
    const lineItems = lines.map(line => ({
      transactionId: newTransaction.id,
      categoryId: line.categoryId,
      amount: line.amount,
      notes: line.notes,
    }));

    const newLines = await db.insert(transactionLines).values(lineItems).returning();

    return NextResponse.json({
      success: true,
      transaction: {
        ...newTransaction,
        lines: newLines,
      },
    });
  } catch (error) {
    console.error('Transaction creation failed:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

// GET - List all transactions with their lines
export async function GET() {
  // We need to join transactions with their lines
  const allTransactions = await db.select().from(transactions);
  
  // For each transaction, get its lines
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
    })
  );

  return NextResponse.json(transactionsWithLines);
}

// DELETE - Delete a transaction (cascades to lines)
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  await db.delete(transactions).where(eq(transactions.id, id));

  return NextResponse.json({ success: true });
}

// PUT - Update transaction (for now, just basic fields)
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, description, notes } = body;

  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  await db
    .update(transactions)
    .set({ description, notes })
    .where(eq(transactions.id, id));

  return NextResponse.json({ success: true });
}
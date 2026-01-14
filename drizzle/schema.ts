import { pgTable, serial, text, integer, timestamp, varchar } from 'drizzle-orm/pg-core';

// Categories - how we classify transactions
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'income' or 'expense'
  color: varchar('color', { length: 7 }).notNull(), // Hex color like '#FF6B6B'
  icon: varchar('icon', { length: 10 }), // Optional emoji
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Transactions - the actual money movements
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  totalAmount: integer('total_amount').notNull(), // In cents
  date: timestamp('date').notNull().defaultNow(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Transaction Lines - how transactions are categorized
export const transactionLines = pgTable('transaction_lines', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  amount: integer('amount').notNull(), // In cents
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
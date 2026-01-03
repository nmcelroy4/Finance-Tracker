import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

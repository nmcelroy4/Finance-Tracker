import { pgTable, serial, timestamp, integer, text } from 'drizzle-orm/pg-core';

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

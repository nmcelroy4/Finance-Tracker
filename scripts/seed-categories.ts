import { db } from '@/db';
import { categories } from '../drizzle/schema';

const defaultCategories = [
  // Income
  { name: 'Salary', type: 'income', color: '#4CAF50', icon: '💰' },
  { name: 'Freelance', type: 'income', color: '#8BC34A', icon: '💼' },
  { name: 'Investment Income', type: 'income', color: '#00BCD4', icon: '📈' },
  
  // Expenses - Essential
  { name: 'Groceries', type: 'expense', color: '#FF6B6B', icon: '🛒' },
  { name: 'Rent/Mortgage', type: 'expense', color: '#E74C3C', icon: '🏠' },
  { name: 'Utilities', type: 'expense', color: '#F39C12', icon: '💡' },
  { name: 'Transportation', type: 'expense', color: '#3498DB', icon: '🚗' },
  { name: 'Gas', type: 'expense', color: '#2980B9', icon: '⛽' },
  
  // Expenses - Lifestyle
  { name: 'Dining Out', type: 'expense', color: '#E67E22', icon: '🍽️' },
  { name: 'Entertainment', type: 'expense', color: '#9B59B6', icon: '🎬' },
  { name: 'Shopping', type: 'expense', color: '#EC407A', icon: '🛍️' },
  { name: 'Health & Fitness', type: 'expense', color: '#26A69A', icon: '💪' },
  { name: 'Personal Care', type: 'expense', color: '#AB47BC', icon: '💅' },
  
  // Expenses - Bills
  { name: 'Phone', type: 'expense', color: '#5C6BC0', icon: '📱' },
  { name: 'Internet', type: 'expense', color: '#42A5F5', icon: '🌐' },
  { name: 'Subscriptions', type: 'expense', color: '#7E57C2', icon: '📺' },
  { name: 'Insurance', type: 'expense', color: '#78909C', icon: '🛡️' },
  
  // Expenses - Other
  { name: 'Travel', type: 'expense', color: '#FF7043', icon: '✈️' },
  { name: 'Education', type: 'expense', color: '#FFA726', icon: '📚' },
  { name: 'Gifts', type: 'expense', color: '#EF5350', icon: '🎁' },
  { name: 'Miscellaneous', type: 'expense', color: '#90A4AE', icon: '📌' },
];

async function seed() {
  console.log('Seeding categories...');
  
  await db.insert(categories).values(defaultCategories);
  
  console.log('✅ Categories seeded successfully!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
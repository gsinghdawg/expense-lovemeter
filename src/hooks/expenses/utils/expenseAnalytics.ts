
import { Expense } from "@/types/expense";

// Helper functions for expense analysis
export function getCurrentMonthExpenses(expenses: Expense[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return expenses.filter(expense => {
    const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && 
           expenseDate.getFullYear() === currentYear;
  });
}

export function getCurrentMonthTotal(expenses: Expense[]) {
  const currentMonthExpenses = getCurrentMonthExpenses(expenses);
  return currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
}

// Calculate average monthly expense from the first expense recorded
export function calculateAverageMonthlyExpense(expenses: Expense[]) {
  if (expenses.length === 0) return 0;
  
  // Sort expenses by date (oldest first)
  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Get the date of the first expense
  const firstExpenseDate = new Date(sortedExpenses[0].date);
  
  // Get the current date
  const currentDate = new Date();
  
  // Calculate the number of months between the first expense and now
  const monthDiff = 
    (currentDate.getFullYear() - firstExpenseDate.getFullYear()) * 12 + 
    (currentDate.getMonth() - firstExpenseDate.getMonth()) + 1;
  
  // Calculate total expense
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Return average monthly expense
  return monthDiff > 0 ? totalExpenses / monthDiff : totalExpenses;
}

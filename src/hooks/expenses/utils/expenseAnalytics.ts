import { Expense } from "@/types/expense";

// Get just the current month's expenses
export function getCurrentMonthExpenses(expenses: Expense[]): Expense[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return expenses.filter(expense => {
    const expenseDate = expense.date;
    return expenseDate.getMonth() === currentMonth && 
           expenseDate.getFullYear() === currentYear;
  });
}

// Calculate the total for current month
export function getCurrentMonthTotal(expenses: Expense[]): number {
  const currentMonthExpenses = getCurrentMonthExpenses(expenses);
  return currentMonthExpenses.reduce((total, expense) => total + expense.amount, 0);
}

// Calculate average monthly expense
export function calculateAverageMonthlyExpense(expenses: Expense[]): number {
  if (expenses.length === 0) return 0;
  
  // Get unique month-year combinations in the data
  const monthsYears = new Set();
  expenses.forEach(expense => {
    const date = expense.date;
    const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
    monthsYears.add(monthYear);
  });
  
  // Only count months that have expenses
  const numMonths = monthsYears.size;
  if (numMonths === 0) return 0;
  
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return total / numMonths;
}

// Calculate total savings based on budget and expenses
export const calculateTotalSavings = (
  expenses: any[], 
  getBudgetForMonth: (month: number, year: number) => number | null
) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Get budget for the current month
  const budget = getBudgetForMonth(currentMonth, currentYear);
  
  // If no budget is set, assume no savings
  if (budget === null || budget === 0) {
    return 0;
  }
  
  // Calculate total expenses for the current month
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && 
           expenseDate.getFullYear() === currentYear;
  });
  
  const total = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate savings (budget - expenses)
  const savings = budget - total;
  
  // Return positive savings or zero if negative
  return Math.max(0, savings);
};

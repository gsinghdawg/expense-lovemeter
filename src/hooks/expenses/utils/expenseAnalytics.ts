
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

// Calculate total savings (budget - expenses) across all months
export function calculateTotalSavings(
  expenses: Expense[], 
  getBudgetForMonth: (month: number, year: number) => number | null
): number {
  if (expenses.length === 0) return 0;
  
  // Get unique month-year combinations in the data
  const monthlyData: Record<string, { total: number, budget: number | null }> = {};
  
  // Populate monthly expenses
  expenses.forEach(expense => {
    const date = expense.date;
    const month = date.getMonth();
    const year = date.getFullYear();
    const key = `${year}-${month}`;
    
    if (!monthlyData[key]) {
      monthlyData[key] = { 
        total: 0, 
        budget: getBudgetForMonth(month, year)
      };
    }
    
    monthlyData[key].total += expense.amount;
  });
  
  // Calculate total savings
  let totalSavings = 0;
  Object.values(monthlyData).forEach(({ total, budget }) => {
    if (budget !== null) {
      totalSavings += (budget - total);
    }
  });
  
  return totalSavings;
}

// Calculate average monthly savings
export function calculateAverageMonthlySavings(
  expenses: Expense[],
  getBudgetForMonth: (month: number, year: number) => number | null
): number | null {
  // Get all month-year combinations where budgets are set
  const monthsWithBudget = new Set<string>();
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Check each month of the current year for budget data
  for (let month = 0; month < 12; month++) {
    const budget = getBudgetForMonth(month, currentYear);
    if (budget !== null) {
      monthsWithBudget.add(`${currentYear}-${month}`);
    }
  }
  
  // Also check for any past year's months in expenses
  expenses.forEach(expense => {
    const date = expense.date;
    const month = date.getMonth();
    const year = date.getFullYear();
    const key = `${year}-${month}`;
    
    const budget = getBudgetForMonth(month, year);
    if (budget !== null) {
      monthsWithBudget.add(key);
    }
  });
  
  // If no months have budgets set, return null
  if (monthsWithBudget.size === 0) return null;
  
  // Calculate monthly expense totals
  const monthlyExpenses: Record<string, number> = {};
  
  expenses.forEach(expense => {
    const date = expense.date;
    const month = date.getMonth();
    const year = date.getFullYear();
    const key = `${year}-${month}`;
    
    if (!monthlyExpenses[key]) {
      monthlyExpenses[key] = 0;
    }
    
    monthlyExpenses[key] += expense.amount;
  });
  
  // Calculate total savings for all months with budgets
  let totalSavings = 0;
  
  Array.from(monthsWithBudget).forEach(monthKey => {
    const [year, month] = monthKey.split('-').map(Number);
    const budget = getBudgetForMonth(month, year);
    const expenses = monthlyExpenses[monthKey] || 0;
    
    if (budget !== null) {
      totalSavings += (budget - expenses);
    }
  });
  
  // Return average monthly savings
  return totalSavings / monthsWithBudget.size;
}

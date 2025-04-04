
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
  if (expenses.length === 0) return 0;
  
  // Get unique month-year combinations in the data and calculate savings for each
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
  
  // Calculate total savings and number of months with budget set
  let totalSavings = 0;
  let monthsWithBudget = 0;
  
  Object.values(monthlyData).forEach(({ total, budget }) => {
    if (budget !== null) {
      totalSavings += (budget - total);
      monthsWithBudget++;
    }
  });
  
  // Return average monthly savings if there are months with budgets
  return monthsWithBudget > 0 ? totalSavings / monthsWithBudget : null;
}

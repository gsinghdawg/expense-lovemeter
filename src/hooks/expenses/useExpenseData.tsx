
import { Expense } from "@/types/expense";
import { useExpenseQuery } from "./queries/useExpenseQuery";
import { useExpenseMutations } from "./mutations/useExpenseMutations";
import { 
  getCurrentMonthExpenses, 
  getCurrentMonthTotal, 
  calculateAverageMonthlyExpense,
  calculateTotalSavings
} from "./utils/expenseAnalytics";

export function useExpenseData(userId: string | undefined) {
  // Fetch expenses with the query hook
  const { 
    data: expenses = [], 
    isLoading: isLoadingExpenses 
  } = useExpenseQuery(userId);

  // Get CRUD operations from the mutations hook
  const {
    addExpense,
    updateExpense,
    deleteExpense
  } = useExpenseMutations(userId);

  // Return all the data and functions needed by consumers
  return {
    expenses,
    isLoadingExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getCurrentMonthExpenses: () => getCurrentMonthExpenses(expenses),
    getCurrentMonthTotal: () => getCurrentMonthTotal(expenses),
    calculateAverageMonthlyExpense: () => calculateAverageMonthlyExpense(expenses),
    calculateTotalSavings: (getBudgetForMonth: (month: number, year: number) => number | null) => 
      calculateTotalSavings(expenses, getBudgetForMonth)
  };
}

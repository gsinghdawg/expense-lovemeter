
import { useAuth } from "@/contexts/AuthContext";
import { useExpenseData } from "./useExpenseData";
import { useCategories } from "./useCategories";
import { useBudgetGoals } from "./useBudgetGoals";

export function useExpenses() {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    expenses,
    isLoadingExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getCurrentMonthExpenses,
    getCurrentMonthTotal
  } = useExpenseData(userId);

  const {
    categories,
    isLoadingCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById
  } = useCategories(userId);

  const {
    budgetGoal,
    budgetHistory,
    isLoadingBudgetGoal,
    isLoadingBudgetHistory,
    updateBudgetGoal,
    getBudgetForMonth
  } = useBudgetGoals(userId);

  const isLoading = isLoadingExpenses || isLoadingCategories || isLoadingBudgetGoal || isLoadingBudgetHistory;

  return {
    // Expense data and methods
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getCurrentMonthExpenses,
    getCurrentMonthTotal,
    
    // Category data and methods
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    
    // Budget data and methods
    budgetGoal,
    budgetHistory,
    updateBudgetGoal,
    getBudgetForMonth,
    
    // Loading state
    isLoading,
  };
}

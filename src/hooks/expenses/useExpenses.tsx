
import { useAuth } from "@/contexts/AuthContext";
import { useExpenseData } from "./useExpenseData";
import { useCategories } from "./useCategories";
import { useBudgetGoals } from "./useBudgetGoals";
import { defaultCategories } from "@/data/categories";

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
    categories: userCategories,
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

  // Always ensure we have categories available
  // If userCategories is undefined, empty, or still loading, use defaultCategories
  const categories = (!userCategories || userCategories.length === 0 || isLoadingCategories) 
    ? defaultCategories 
    : userCategories;

  console.log("useExpenses defaultCategories:", defaultCategories);
  console.log("useExpenses userCategories:", userCategories);
  console.log("useExpenses final categories:", categories);

  const isLoading = isLoadingExpenses || isLoadingBudgetGoal || isLoadingBudgetHistory;

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

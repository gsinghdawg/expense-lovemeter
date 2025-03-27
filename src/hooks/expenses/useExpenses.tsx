
import { useAuth } from "@/contexts/AuthContext";
import { useExpenseData } from "./useExpenseData";
import { useCategories } from "./useCategories";
import { useBudgetGoals } from "./useBudgetGoals";
import { useSavingGoals } from "./useSavingGoals";
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
    getCurrentMonthTotal,
    calculateAverageMonthlyExpense,
    calculateTotalSavings
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
    budgetGoalsData,
    budgetHistory,
    isLoadingBudgetGoal,
    isLoadingBudgetHistory,
    updateBudgetGoal,
    getBudgetForMonth
  } = useBudgetGoals(userId);

  const {
    savingGoals,
    isLoadingSavingGoals,
    addSavingGoal,
    toggleSavingGoal,
    deleteSavingGoal,
    distributeSavings
  } = useSavingGoals(userId);

  // Always ensure we have categories available
  // If userCategories is undefined, empty, or still loading, use defaultCategories
  const categories = (!userCategories || userCategories.length === 0 || isLoadingCategories) 
    ? defaultCategories 
    : userCategories;

  const isLoading = isLoadingExpenses || isLoadingBudgetGoal || isLoadingBudgetHistory || isLoadingSavingGoals;

  const getTotalSavings = () => {
    return calculateTotalSavings(getBudgetForMonth);
  };

  // Calculate the current month's savings (budget - expenses)
  const getCurrentMonthSavings = () => {
    const currentMonthTotal = getCurrentMonthTotal();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const budget = getBudgetForMonth(currentMonth, currentYear);
    
    // Only calculate savings if budget is explicitly set
    if (budget === null) return 0;
    
    const savings = budget - currentMonthTotal;
    return Math.max(0, savings); // Only return positive savings
  };

  return {
    // Expense data and methods
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getCurrentMonthExpenses,
    getCurrentMonthTotal,
    calculateAverageMonthlyExpense,
    getTotalSavings,
    getCurrentMonthSavings,
    
    // Category data and methods
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    
    // Budget data and methods
    budgetGoal,
    budgetGoalsData,
    budgetHistory,
    updateBudgetGoal,
    getBudgetForMonth,
    
    // Saving goals data and methods
    savingGoals,
    addSavingGoal,
    toggleSavingGoal,
    deleteSavingGoal,
    distributeSavings,
    
    // Loading state
    isLoading,
  };
}

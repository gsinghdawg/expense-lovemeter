
import { useAuth } from "@/contexts/AuthContext";
import { useExpenseData } from "./useExpenseData";
import { useCategories } from "./useCategories";
import { useBudgetGoals } from "./useBudgetGoals";
import { useCategoryBudgets } from "./useCategoryBudgets";
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
    categoryBudgets,
    isLoadingCategoryBudgets,
    setCategoryBudget,
    deleteCategoryBudget,
    getCategoryBudget,
    totalCategoryBudget,
    refetchCategoryBudgets
  } = useCategoryBudgets(userId, budgetGoal.month, budgetGoal.year);

  // Always ensure we have categories available
  // If userCategories is undefined, empty, or still loading, use defaultCategories
  const categories = (!userCategories || userCategories.length === 0 || isLoadingCategories) 
    ? defaultCategories 
    : userCategories;

  const isLoading = isLoadingExpenses || isLoadingBudgetGoal || isLoadingBudgetHistory || isLoadingCategoryBudgets;

  const getTotalSavings = () => {
    return calculateTotalSavings(getBudgetForMonth);
  };

  // We're not modifying the getBudgetForMonth function directly as it's provided by useBudgetGoals
  // and the functionality to only return explicitly set budgets is already implemented there

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
    
    // Category budget data and methods
    categoryBudgets,
    setCategoryBudget,
    deleteCategoryBudget,
    getCategoryBudget,
    totalCategoryBudget,
    refetchCategoryBudgets,
    
    // Loading state
    isLoading,
  };
}

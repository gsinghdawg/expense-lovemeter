
import { ExpenseCategory } from "@/types/expense";
import { defaultCategories } from "@/data/categories";
import { useCategoryQuery } from "./queries/useCategoryQuery";
import { useCategoryMutations } from "./mutations/useCategoryMutations";
import { getCategoryById as getCategory } from "./utils/categoryUtils";

export function useCategories(userId: string | undefined) {
  // Use the query hook
  const { 
    data: categories = [], 
    isLoading: isLoadingCategories 
  } = useCategoryQuery(userId);

  // Use the mutations hook
  const {
    addCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation
  } = useCategoryMutations(userId);

  const addCategory = (category: Omit<ExpenseCategory, "id">) => {
    addCategoryMutation.mutate(category);
    return { ...category, id: 'pending' };
  };

  const updateCategory = (category: ExpenseCategory) => {
    updateCategoryMutation.mutate(category);
  };

  const deleteCategory = (id: string) => {
    try {
      deleteCategoryMutation.mutate(id);
      return true;
    } catch (error) {
      return false;
    }
  };

  const getCategoryById = (id: string) => {
    return getCategory(categories, id);
  };

  // If categories is empty, use defaultCategories
  const finalCategories = categories.length > 0 ? categories : defaultCategories;

  return {
    categories: finalCategories,
    isLoadingCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
  };
}

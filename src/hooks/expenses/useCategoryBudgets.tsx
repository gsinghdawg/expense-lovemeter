
import { useState, useEffect } from "react";
import { CategoryBudget, ExpenseCategory } from "@/types/expense";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useCategoryBudgets(userId: string | undefined, month?: number, year?: number) {
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const currentMonth = month !== undefined ? month : currentDate.getMonth();
  const currentYear = year !== undefined ? year : currentDate.getFullYear();

  // Fetch category budgets from Supabase
  const { 
    data: categoryBudgets = [],
    isLoading: isLoadingCategoryBudgets,
    refetch: refetchCategoryBudgets
  } = useQuery({
    queryKey: ['category-budgets', userId, currentMonth, currentYear],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('category_budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .eq('year', currentYear);
      
      if (error) {
        console.error("Error fetching category budgets:", error);
        toast({
          title: "Error loading category budgets",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data.map((budget) => ({
        id: budget.id,
        categoryId: budget.category_id,
        amount: budget.amount,
        month: budget.month,
        year: budget.year
      })) as CategoryBudget[];
    },
    enabled: !!userId,
  });

  // Calculate the total of all category budgets
  const totalCategoryBudget = categoryBudgets.reduce(
    (sum, budget) => sum + budget.amount, 
    0
  );

  // Create or update category budget
  const upsertCategoryBudgetMutation = useMutation({
    mutationFn: async (categoryBudget: Omit<CategoryBudget, "id">) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { data: existingBudget, error: checkError } = await supabase
        .from('category_budgets')
        .select('id')
        .eq('user_id', userId)
        .eq('category_id', categoryBudget.categoryId)
        .eq('month', categoryBudget.month)
        .eq('year', categoryBudget.year)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      let budgetResult;
      
      if (existingBudget) {
        // Update existing budget
        const { data, error } = await supabase
          .from('category_budgets')
          .update({
            amount: categoryBudget.amount,
          })
          .eq('id', existingBudget.id)
          .eq('user_id', userId)
          .select()
          .single();
          
        if (error) throw error;
        budgetResult = data;
      } else {
        // Create new budget
        const { data, error } = await supabase
          .from('category_budgets')
          .insert({
            category_id: categoryBudget.categoryId,
            amount: categoryBudget.amount,
            month: categoryBudget.month,
            year: categoryBudget.year,
            user_id: userId,
          })
          .select()
          .single();
          
        if (error) throw error;
        budgetResult = data;
      }
      
      return {
        id: budgetResult.id,
        categoryId: budgetResult.category_id,
        amount: budgetResult.amount,
        month: budgetResult.month,
        year: budgetResult.year,
      } as CategoryBudget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-budgets', userId, currentMonth, currentYear] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating category budget",
        description: error.message || "Failed to update category budget",
        variant: "destructive",
      });
    },
  });

  // Delete category budget
  const deleteCategoryBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('category_budgets')
        .delete()
        .eq('id', budgetId)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return budgetId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-budgets', userId, currentMonth, currentYear] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting category budget",
        description: error.message || "Failed to delete category budget",
        variant: "destructive",
      });
    },
  });

  const setCategoryBudget = (categoryBudget: Omit<CategoryBudget, "id">) => {
    upsertCategoryBudgetMutation.mutate(categoryBudget);
  };

  const deleteCategoryBudget = (budgetId: string) => {
    deleteCategoryBudgetMutation.mutate(budgetId);
  };

  const getCategoryBudget = (categoryId: string) => {
    return categoryBudgets.find(budget => budget.categoryId === categoryId);
  };

  return {
    categoryBudgets,
    isLoadingCategoryBudgets,
    setCategoryBudget,
    deleteCategoryBudget,
    getCategoryBudget,
    totalCategoryBudget,
    refetchCategoryBudgets
  };
}

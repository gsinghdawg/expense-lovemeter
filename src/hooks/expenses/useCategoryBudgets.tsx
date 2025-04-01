
import { useState } from "react";
import { CategoryBudget } from "@/types/expense";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useCategoryBudgets(userId: string | undefined) {
  const queryClient = useQueryClient();
  const [isAllocating, setIsAllocating] = useState(false);

  // Fetch all category budgets from Supabase
  const { 
    data: categoryBudgets = [],
    isLoading: isLoadingCategoryBudgets 
  } = useQuery({
    queryKey: ['category-budgets', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('category_budgets')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: true })
        .order('month', { ascending: true });
      
      if (error) {
        console.error("Error fetching category budgets:", error);
        toast({
          title: "Error loading category budgets",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data.map((budget: any) => ({
        id: budget.id,
        categoryId: budget.category_id,
        amount: budget.amount,
        month: budget.month,
        year: budget.year
      })) || [];
    },
    enabled: !!userId,
  });

  // Update or create category budget mutation
  const updateCategoryBudgetMutation = useMutation({
    mutationFn: async (categoryBudget: Omit<CategoryBudget, 'id'>) => {
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
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-budgets', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating category budget",
        description: error.message || "Failed to update category budget",
        variant: "destructive",
      });
    },
  });

  // Delete category budget mutation
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
      queryClient.invalidateQueries({ queryKey: ['category-budgets', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting category budget",
        description: error.message || "Failed to delete category budget",
        variant: "destructive",
      });
    },
  });

  // Bulk update category budgets
  const bulkUpdateCategoryBudgets = async (
    categoryBudgets: Omit<CategoryBudget, 'id'>[],
    monthlyBudget: number | null
  ) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to update category budgets",
        variant: "destructive",
      });
      return false;
    }

    if (monthlyBudget === null) {
      toast({
        title: "Error",
        description: "You must set a monthly budget goal first",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsAllocating(true);
      
      // Calculate total allocated amount
      const totalAllocated = categoryBudgets.reduce((sum, budget) => sum + budget.amount, 0);
      
      // Validate total equals monthly budget
      if (Math.abs(totalAllocated - monthlyBudget) > 0.01) {
        toast({
          title: "Budget allocation error",
          description: `The total allocated amount ($${totalAllocated.toFixed(2)}) must equal the monthly budget ($${monthlyBudget.toFixed(2)})`,
          variant: "destructive",
        });
        return false;
      }
      
      // Update each category budget
      for (const budget of categoryBudgets) {
        await updateCategoryBudgetMutation.mutateAsync(budget);
      }
      
      toast({
        title: "Budget allocated successfully",
        description: `Your monthly budget of $${monthlyBudget.toFixed(2)} has been allocated across categories.`,
      });
      
      return true;
    } catch (error: any) {
      console.error("Error updating category budgets:", error);
      toast({
        title: "Error allocating budget",
        description: error.message || "Failed to update category budgets",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsAllocating(false);
    }
  };

  // Get category budgets for a specific month and year
  const getCategoryBudgetsForMonth = (month: number, year: number) => {
    return categoryBudgets.filter(
      budget => budget.month === month && budget.year === year
    );
  };
  
  // Get budget for a specific category in a given month and year
  const getCategoryBudgetForMonth = (categoryId: string, month: number, year: number) => {
    return categoryBudgets.find(
      budget => budget.categoryId === categoryId && 
                budget.month === month && 
                budget.year === year
    );
  };

  return {
    categoryBudgets,
    isLoadingCategoryBudgets,
    isAllocating,
    updateCategoryBudget: (budget: Omit<CategoryBudget, 'id'>) => 
      updateCategoryBudgetMutation.mutate(budget),
    deleteCategoryBudget: (budgetId: string) => 
      deleteCategoryBudgetMutation.mutate(budgetId),
    bulkUpdateCategoryBudgets,
    getCategoryBudgetsForMonth,
    getCategoryBudgetForMonth
  };
}

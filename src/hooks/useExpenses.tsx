import { useState, useEffect } from "react";
import { Expense, ExpenseCategory, BudgetGoal, BudgetGoalHistory } from "@/types/expense";
import { defaultCategories } from "@/data/categories";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useExpenses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Fetch expenses from Supabase
  const { 
    data: expenses = [], 
    isLoading: isLoadingExpenses 
  } = useQuery({
    queryKey: ['expenses', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error("Error fetching expenses:", error);
        toast({
          title: "Error loading expenses",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data.map(expense => ({
        ...expense,
        id: expense.id,
        date: new Date(expense.date),
      }));
    },
    enabled: !!userId,
  });

  // Fetch categories from Supabase
  const { 
    data: fetchedCategories = [], 
    isLoading: isLoadingCategories 
  } = useQuery({
    queryKey: ['categories', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error loading categories",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      if (data.length === 0) {
        // If no categories exist for the user, create default ones
        await initializeDefaultCategories(userId);
        
        // Return default categories since we just created them
        return defaultCategories.map(category => ({
          ...category,
          user_id: userId,
        }));
      }
      
      return data.map(category => ({
        id: category.id,
        name: category.name,
        color: category.color,
      }));
    },
    enabled: !!userId,
  });

  // Initialize default categories for new users
  const initializeDefaultCategories = async (userId: string) => {
    try {
      const categories = defaultCategories.map(category => ({
        name: category.name,
        color: category.color,
        icon: 'default',
        user_id: userId,
      }));
      
      const { error } = await supabase.from('categories').insert(categories);
      
      if (error) {
        console.error("Error creating default categories:", error);
        toast({
          title: "Error creating categories",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("Failed to initialize default categories", e);
    }
  };

  // Fetch budget goal from Supabase
  const { 
    data: budgetGoalData,
    isLoading: isLoadingBudgetGoal 
  } = useQuery({
    queryKey: ['budget-goal', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const { data, error } = await supabase
        .from('budget_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching budget goal:", error);
        toast({
          title: "Error loading budget goal",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
      
      return data;
    },
    enabled: !!userId,
  });
  
  const budgetGoal: BudgetGoal = budgetGoalData 
    ? { 
        amount: budgetGoalData.amount, 
        month: budgetGoalData.month, 
        year: budgetGoalData.year 
      } 
    : { 
        amount: null, 
        month: new Date().getMonth(), 
        year: new Date().getFullYear() 
      };

  // Fetch budget history from Supabase
  const { 
    data: budgetHistory = [], 
    isLoading: isLoadingBudgetHistory 
  } = useQuery({
    queryKey: ['budget-history', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('budget_goal_history')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error("Error fetching budget history:", error);
        toast({
          title: "Error loading budget history",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data.map(budget => ({
        ...budget,
        startDate: new Date(budget.start_date),
      }));
    },
    enabled: !!userId,
  });

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (expense: Omit<Expense, "id">) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          description: expense.description,
          amount: expense.amount,
          date: expense.date.toISOString(),
          category_id: expense.categoryId,
          user_id: userId,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        ...data,
        date: new Date(data.date),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding expense",
        description: error.message || "Failed to add expense",
        variant: "destructive",
      });
    },
  });

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: async (expense: Expense) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('expenses')
        .update({
          description: expense.description,
          amount: expense.amount,
          date: expense.date.toISOString(),
          category_id: expense.categoryId,
        })
        .eq('id', expense.id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating expense",
        description: error.message || "Failed to update expense",
        variant: "destructive",
      });
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting expense",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (category: Omit<ExpenseCategory, "id">) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          color: category.color,
          icon: 'default',
          user_id: userId,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        color: data.color,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding category",
        description: error.message || "Failed to add category",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (category: ExpenseCategory) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('categories')
        .update({
          name: category.name,
          color: category.color,
        })
        .eq('id', category.id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating category",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("User not authenticated");
      
      // Check if the category is in use
      const { data: expensesUsingCategory, error: checkError } = await supabase
        .from('expenses')
        .select('id')
        .eq('category_id', id)
        .eq('user_id', userId);
      
      if (checkError) throw checkError;
      
      if (expensesUsingCategory && expensesUsingCategory.length > 0) {
        throw new Error("Category is in use by some expenses");
      }
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting category",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  // Update budget goal mutation
  const updateBudgetGoalMutation = useMutation({
    mutationFn: async (newBudget: BudgetGoal) => {
      if (!userId) throw new Error("User not authenticated");
      
      const now = new Date();
      
      // First, check if we have an existing budget for this month/year
      const { data: existingBudget, error: checkError } = await supabase
        .from('budget_goals')
        .select('id')
        .eq('user_id', userId)
        .eq('month', newBudget.month)
        .eq('year', newBudget.year)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      let budgetResult;
      
      if (existingBudget) {
        // Update existing budget
        const { data, error } = await supabase
          .from('budget_goals')
          .update({
            amount: newBudget.amount,
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
          .from('budget_goals')
          .insert({
            amount: newBudget.amount,
            month: newBudget.month,
            year: newBudget.year,
            user_id: userId,
          })
          .select()
          .single();
          
        if (error) throw error;
        budgetResult = data;
      }
      
      // Add to budget history
      const { error: historyError } = await supabase
        .from('budget_goal_history')
        .insert({
          amount: newBudget.amount,
          month: newBudget.month,
          year: newBudget.year,
          start_date: now.toISOString(),
          user_id: userId,
        });
        
      if (historyError) {
        console.error("Error adding budget history:", historyError);
      }
      
      return {
        amount: budgetResult.amount,
        month: budgetResult.month,
        year: budgetResult.year,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-goal', userId] });
      queryClient.invalidateQueries({ queryKey: ['budget-history', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating budget",
        description: error.message || "Failed to update budget",
        variant: "destructive",
      });
    },
  });

  const addExpense = (expense: Omit<Expense, "id">) => {
    addExpenseMutation.mutate(expense);
    return { ...expense, id: 'pending' }; // Return a temporary object with a placeholder ID
  };

  const updateExpense = (expense: Expense) => {
    updateExpenseMutation.mutate(expense);
  };

  const deleteExpense = (id: string) => {
    deleteExpenseMutation.mutate(id);
  };

  const addCategory = (category: Omit<ExpenseCategory, "id">) => {
    addCategoryMutation.mutate(category);
    return { ...category, id: 'pending' }; // Return a temporary object with a placeholder ID
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

  const updateBudgetGoal = (newBudget: BudgetGoal) => {
    updateBudgetGoalMutation.mutate(newBudget);
  };

  const getCurrentMonthExpenses = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return expenses.filter(expense => {
      const expenseDate = expense.date;
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });
  };

  const getCurrentMonthTotal = () => {
    const currentMonthExpenses = getCurrentMonthExpenses();
    return currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getBudgetForMonth = (month: number, year: number) => {
    // Sort budget history from newest to oldest
    const sortedHistory = [...budgetHistory].sort((a, b) => 
      b.startDate.getTime() - a.startDate.getTime()
    );
    
    // Create date objects for comparison (use first day of month)
    const targetDate = new Date(year, month, 1);
    
    // Find the most recent budget that was set before or on the target month
    for (const budget of sortedHistory) {
      const budgetDate = new Date(budget.year, budget.month, 1);
      
      if (budgetDate.getTime() <= targetDate.getTime()) {
        return budget.amount;
      }
    }
    
    return null;
  };

  const getCategoryById = (id: string) => {
    // First try to find the category in fetched categories
    const category = fetchedCategories.find(c => c.id === id);
    if (category) return category;
    
    // If not found, try to find it in default categories
    const defaultCategory = defaultCategories.find(c => c.id === id);
    if (defaultCategory) return defaultCategory;
    
    // If still not found, return the "Other" category as fallback
    return defaultCategories.find(c => c.id === "other") || {
      id: "unknown",
      name: "Unknown Category",
      color: "#CCCCCC"
    };
  };

  const isLoading = isLoadingExpenses || isLoadingCategories || isLoadingBudgetGoal || isLoadingBudgetHistory;

  return {
    expenses,
    categories: fetchedCategories,
    budgetGoal,
    budgetHistory,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    updateBudgetGoal,
    getCurrentMonthExpenses,
    getCurrentMonthTotal,
    getBudgetForMonth,
  };
}

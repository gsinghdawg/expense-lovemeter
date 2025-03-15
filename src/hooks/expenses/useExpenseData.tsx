import { Expense } from "@/types/expense";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useExpenseData(userId: string | undefined) {
  const queryClient = useQueryClient();

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
        id: expense.id,
        amount: expense.amount,
        description: expense.description,
        date: new Date(expense.date),
        categoryId: expense.category_id,
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
        id: data.id,
        amount: data.amount,
        description: data.description,
        date: new Date(data.date),
        categoryId: data.category_id,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      toast({
        title: "Expense added",
        description: "Your expense has been added successfully.",
      });
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
      
      console.log("Updating expense:", expense);
      console.log("Date to be stored:", expense.date);
      console.log("Date in ISO format:", expense.date.toISOString());
      
      const { error, data } = await supabase
        .from('expenses')
        .update({
          description: expense.description,
          amount: expense.amount,
          date: expense.date instanceof Date 
            ? expense.date.toISOString() 
            : new Date(expense.date).toISOString(),
          category_id: expense.categoryId,
        })
        .eq('id', expense.id)
        .eq('user_id', userId)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating expense:", error);
        throw error;
      }
      
      console.log("Updated expense from DB:", data);
      
      // Return the updated expense with proper date conversion
      return {
        id: data.id,
        amount: data.amount,
        description: data.description,
        date: new Date(data.date),
        categoryId: data.category_id,
      };
    },
    onSuccess: (updatedExpense) => {
      console.log("Update successful. Updated expense:", updatedExpense);
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      toast({
        title: "Expense updated",
        description: "Your expense has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
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
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      toast({
        title: "Expense deleted",
        description: "Your expense has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting expense",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  const addExpense = (expense: Omit<Expense, "id">) => {
    addExpenseMutation.mutate(expense);
    return { ...expense, id: 'pending' };
  };

  const updateExpense = (expense: Expense) => {
    console.log("updateExpense called with:", expense);
    // Ensure expense.date is a Date object before mutation
    const expenseWithValidDate = {
      ...expense,
      date: expense.date instanceof Date ? expense.date : new Date(expense.date)
    };
    console.log("Expense with valid date:", expenseWithValidDate);
    updateExpenseMutation.mutate(expenseWithValidDate);
  };

  const deleteExpense = (id: string) => {
    deleteExpenseMutation.mutate(id);
  };

  // Helper methods for expense analysis
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

  return {
    expenses,
    isLoadingExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getCurrentMonthExpenses,
    getCurrentMonthTotal
  };
}

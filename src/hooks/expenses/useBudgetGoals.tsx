
import { BudgetGoal, BudgetGoalHistory } from "@/types/expense";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useBudgetGoals(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch all budget goals from Supabase
  const { 
    data: budgetGoalsData = [],
    isLoading: isLoadingBudgetGoals 
  } = useQuery({
    queryKey: ['budget-goals', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('budget_goals')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: true })
        .order('month', { ascending: true });
      
      if (error) {
        console.error("Error fetching budget goals:", error);
        toast({
          title: "Error loading budget goals",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data || [];
    },
    enabled: !!userId,
  });
  
  // Get current month budget goal
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const currentBudgetGoal = budgetGoalsData.find(
    goal => goal.month === currentMonth && goal.year === currentYear
  );
  
  const budgetGoal: BudgetGoal = currentBudgetGoal 
    ? { 
        amount: currentBudgetGoal.amount, 
        month: currentBudgetGoal.month, 
        year: currentBudgetGoal.year 
      } 
    : { 
        amount: null, 
        month: currentMonth, 
        year: currentYear 
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

  // Update budget goal mutation
  const updateBudgetGoalMutation = useMutation({
    mutationFn: async (newBudget: BudgetGoal) => {
      if (!userId) throw new Error("User not authenticated");
      
      const now = new Date();
      
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
      queryClient.invalidateQueries({ queryKey: ['budget-goals', userId] });
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

  const updateBudgetGoal = (newBudget: BudgetGoal) => {
    updateBudgetGoalMutation.mutate(newBudget);
  };

  const getBudgetForMonth = (month: number, year: number) => {
    // First check if there's a direct budget set for this month/year
    const directBudget = budgetGoalsData.find(
      budget => budget.month === month && budget.year === year
    );
    
    if (directBudget) {
      return directBudget.amount;
    }
    
    // Fall back to the historical budget if no direct budget is set
    const sortedHistory = [...budgetHistory].sort((a, b) => 
      b.startDate.getTime() - a.startDate.getTime()
    );
    
    const targetDate = new Date(year, month, 1);
    
    for (const budget of sortedHistory) {
      const budgetDate = new Date(budget.year, budget.month, 1);
      
      if (budgetDate.getTime() <= targetDate.getTime()) {
        return budget.amount;
      }
    }
    
    return null;
  };

  return {
    budgetGoal,
    budgetGoalsData,
    budgetHistory,
    isLoadingBudgetGoal: isLoadingBudgetGoals,
    isLoadingBudgetHistory,
    updateBudgetGoal,
    getBudgetForMonth
  };
}


import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SavingGoal } from '@/types/expense';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useSavingGoals(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch all saving goals from storage
  const { 
    data: savingGoals = [],
    isLoading: isLoadingSavingGoals 
  } = useQuery({
    queryKey: ['saving-goals', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('saving_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created', { ascending: false });
      
      if (error) {
        console.error("Error fetching saving goals:", error);
        toast({
          title: "Error loading saving goals",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data.map(goal => ({
        ...goal,
        id: goal.id,
        created: new Date(goal.created),
        progress: goal.progress || 0 // Default to 0 if progress is null
      })) as SavingGoal[];
    },
    enabled: !!userId,
  });

  // Add saving goal mutation
  const addSavingGoalMutation = useMutation({
    mutationFn: async (newGoal: Omit<SavingGoal, 'id' | 'created' | 'achieved' | 'progress'>) => {
      if (!userId) throw new Error("User not authenticated");
      
      const goalId = uuidv4();
      const now = new Date();
      
      const { data, error } = await supabase
        .from('saving_goals')
        .insert({
          id: goalId,
          amount: newGoal.amount,
          purpose: newGoal.purpose,
          created: now.toISOString(),
          achieved: false,
          progress: 0, // Initialize progress to 0
          user_id: userId
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        ...data,
        id: data.id,
        created: new Date(data.created),
        progress: data.progress || 0
      } as SavingGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', userId] });
      toast({
        title: "Saving goal added",
        description: "Your new saving goal has been created",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding saving goal",
        description: error.message || "Failed to add saving goal",
        variant: "destructive",
      });
    },
  });

  // Toggle saving goal achievement mutation
  const toggleSavingGoalMutation = useMutation({
    mutationFn: async ({ id, achieved }: { id: string, achieved: boolean }) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('saving_goals')
        .update({ achieved })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        ...data,
        id: data.id,
        created: new Date(data.created),
        progress: data.progress || 0
      } as SavingGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', userId] });
      toast({
        title: data.achieved ? "Goal achieved!" : "Goal reactivated",
        description: data.achieved 
          ? `Congratulations on achieving your goal: ${data.purpose}` 
          : `You've reactivated your goal: ${data.purpose}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating goal",
        description: error.message || "Failed to update goal status",
        variant: "destructive",
      });
    },
  });

  // Delete saving goal mutation
  const deleteSavingGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('saving_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', userId] });
      toast({
        title: "Saving goal deleted",
        description: "Your saving goal has been removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting goal",
        description: error.message || "Failed to delete saving goal",
        variant: "destructive",
      });
    },
  });

  // Update goal progress mutation
  const updateGoalProgressMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string, amount: number }) => {
      if (!userId) throw new Error("User not authenticated");
      
      // First, get the current goal to calculate the new progress
      const { data: goalData, error: goalError } = await supabase
        .from('saving_goals')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
        
      if (goalError) throw goalError;
      
      // Calculate new progress (add the amount to existing progress)
      const currentProgress = goalData.progress || 0;
      const newProgress = currentProgress + amount;
      
      // Determine if the goal is now achieved
      const isAchieved = newProgress >= goalData.amount;
      
      // Update the goal with new progress and possibly achievement status
      const { data, error } = await supabase
        .from('saving_goals')
        .update({ 
          progress: newProgress,
          achieved: isAchieved ? true : goalData.achieved
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        ...data,
        id: data.id,
        created: new Date(data.created),
        progress: data.progress || 0
      } as SavingGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', userId] });
      
      // Show different toast messages based on goal achievement
      if (data.achieved && data.progress >= data.amount) {
        toast({
          title: "Goal achieved! 🎉",
          description: `You've completed your goal: ${data.purpose}`,
        });
      } else {
        toast({
          title: "Progress updated",
          description: `Added to your goal: ${data.purpose}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error updating progress",
        description: error.message || "Failed to update goal progress",
        variant: "destructive",
      });
    },
  });

  // Contribute savings to active goals
  const contributeMonthlySavings = async (savings: number) => {
    if (!userId || savings <= 0) return;
    
    // Get all active goals
    const activeGoals = savingGoals.filter(goal => !goal.achieved);
    
    if (activeGoals.length === 0) {
      toast({
        title: "No active goals",
        description: `You saved $${savings.toFixed(2)} this month, but have no active goals to contribute to.`,
      });
      return;
    }

    // For simplicity, distribute savings equally among all active goals
    const amountPerGoal = savings / activeGoals.length;
    
    // Update each active goal with its portion of the savings
    for (const goal of activeGoals) {
      await updateGoalProgressMutation.mutateAsync({
        id: goal.id,
        amount: amountPerGoal
      });
    }
    
    toast({
      title: "Monthly savings distributed",
      description: `$${savings.toFixed(2)} has been distributed among your ${activeGoals.length} active goals.`,
    });
  };

  // Wrapper functions
  const addSavingGoal = (goal: Omit<SavingGoal, 'id' | 'created' | 'achieved' | 'progress'>) => {
    addSavingGoalMutation.mutate(goal);
  };

  const toggleSavingGoal = (id: string, achieved: boolean) => {
    toggleSavingGoalMutation.mutate({ id, achieved });
  };

  const deleteSavingGoal = (id: string) => {
    deleteSavingGoalMutation.mutate(id);
  };

  const updateGoalProgress = (id: string, amount: number) => {
    updateGoalProgressMutation.mutate({ id, amount });
  };

  return {
    savingGoals,
    isLoadingSavingGoals,
    addSavingGoal,
    toggleSavingGoal,
    deleteSavingGoal,
    updateGoalProgress,
    contributeMonthlySavings
  };
}

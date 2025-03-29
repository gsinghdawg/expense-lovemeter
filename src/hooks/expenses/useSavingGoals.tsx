
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SavingGoal } from '@/types/expense';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useSavingGoals(userId: string | undefined) {
  const queryClient = useQueryClient();
  const [recoveredSavings, setRecoveredSavings] = useState<number>(0);

  // Fetch all saving goals from storage
  const { 
    data: savingGoals = [],
    isLoadingSavingGoals 
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
        previousProgress: goal.previous_progress
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
        previousProgress: data.previous_progress
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
      
      // Find the current goal to get its progress
      const currentGoal = savingGoals.find(goal => goal.id === id);
      if (!currentGoal) throw new Error("Goal not found");
      
      let updateData: any = {};
      
      if (achieved) {
        // When marking as achieved, store the current progress as previous_progress
        updateData = { 
          achieved: true,
          // Store current progress for potential restoration later
          previous_progress: currentGoal.progress
        };
      } else {
        // When unmarking as achieved, restore the previous progress if available
        updateData = { 
          achieved: false,
          // Restore the previous progress value before it was marked as achieved
          progress: currentGoal.previousProgress || 0
        };
      }
      
      const { data, error } = await supabase
        .from('saving_goals')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        ...data,
        id: data.id,
        created: new Date(data.created),
        previousProgress: data.previous_progress
      } as SavingGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', userId] });
      
      if (data.achieved) {
        toast({
          title: "Goal achieved!",
          description: `Congratulations on achieving your goal: ${data.purpose}`
        });
      } else {
        toast({
          title: "Goal reactivated",
          description: `You've reactivated your goal: ${data.purpose} and restored your previous progress.`,
        });
      }
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
      
      // First, get the goal to recover its progress amount
      const goalToDelete = savingGoals.find(goal => goal.id === id);
      if (!goalToDelete) throw new Error("Goal not found");
      
      // Store the progress amount to return to available savings
      const progressAmount = goalToDelete.progress || 0;
      
      const { error } = await supabase
        .from('saving_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Return both the deleted ID and the amount to recover
      return { 
        id, 
        recoveredAmount: progressAmount 
      };
    },
    onSuccess: ({ id, recoveredAmount }) => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', userId] });
      
      // Save the recovered amount to state for other components to use
      setRecoveredSavings(prev => prev + recoveredAmount);
      
      toast({
        title: "Saving goal deleted",
        description: recoveredAmount > 0 
          ? `Your saving goal has been removed and $${recoveredAmount.toFixed(2)} has been returned to your available savings`
          : "Your saving goal has been removed",
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

  // Distribute savings mutation
  const distributeSavingsMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!userId) throw new Error("User not authenticated");
      
      // Get active goals
      const activeGoals = savingGoals.filter(goal => !goal.achieved);
      if (activeGoals.length === 0) return [];
      
      // Strategy: Distribute proportionally based on remaining amount needed
      const totalRemaining = activeGoals.reduce(
        (sum, goal) => sum + (goal.amount - goal.progress), 
        0
      );
      
      const updates = activeGoals.map(goal => {
        const remaining = goal.amount - goal.progress;
        const proportion = remaining / totalRemaining;
        
        // Calculate how much to add to this goal
        let amountToAdd = Math.min(amount * proportion, remaining);
        
        // Round to 2 decimal places
        amountToAdd = Math.round(amountToAdd * 100) / 100;
        
        const newProgress = goal.progress + amountToAdd;
        const achieved = newProgress >= goal.amount;
        
        // If goal will be achieved, store current progress as previous_progress
        const updateData: any = {
          progress: newProgress,
          achieved: achieved
        };
        
        // If goal is being achieved, store current progress for potential restoration
        if (achieved) {
          updateData.previous_progress = goal.progress;
        }
        
        return {
          id: goal.id,
          progress: newProgress,
          achieved: achieved,
          amountAdded: amountToAdd,
          updateData
        };
      });
      
      // Update each goal in the database
      for (const update of updates) {
        const { error } = await supabase
          .from('saving_goals')
          .update(update.updateData)
          .eq('id', update.id)
          .eq('user_id', userId);
          
        if (error) throw error;
      }
      
      return updates;
    },
    onSuccess: (updates) => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', userId] });
      
      // Find goals that were achieved
      const achievedGoals = updates.filter(update => update.achieved);
      
      if (achievedGoals.length > 0) {
        toast({
          title: "Goals achieved!",
          description: `${achievedGoals.length} saving goal${achievedGoals.length > 1 ? 's' : ''} completed.`,
        });
      } else {
        toast({
          title: "Savings distributed",
          description: `Savings have been added to your active goals.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error distributing savings",
        description: error.message || "Failed to distribute savings to goals",
        variant: "destructive",
      });
    },
  });

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

  const distributeSavings = (amount: number) => {
    distributeSavingsMutation.mutate(amount);
  };

  // Getter for recovered savings amount
  const getRecoveredSavings = () => {
    const amount = recoveredSavings;
    
    // Reset the recoveredSavings after it's been read
    // This prevents double-counting
    setRecoveredSavings(0);
    
    return amount;
  };

  return {
    savingGoals,
    isLoadingSavingGoals,
    addSavingGoal,
    toggleSavingGoal,
    deleteSavingGoal,
    distributeSavings,
    getRecoveredSavings, // New method to get the amount recovered from deleted goals
  };
}

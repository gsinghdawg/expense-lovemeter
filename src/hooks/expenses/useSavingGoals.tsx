
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SavingGoal } from '@/types/expense';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useSavingGoals(userId: string | undefined) {
  const queryClient = useQueryClient();
  const [recoveredSavings, setRecoveredSavings] = useState<number>(0);
  // Track distributed savings per month
  const [distributedSavings, setDistributedSavings] = useState<Record<string, number>>({});

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
        previousProgress: 0 // Default value since the column doesn't exist
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
        previousProgress: 0 // Default value
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

  // Toggle saving goal achievement mutation - updated to reverse distributions
  const toggleSavingGoalMutation = useMutation({
    mutationFn: async ({ id, achieved }: { id: string, achieved: boolean }) => {
      if (!userId) throw new Error("User not authenticated");
      
      // Find the current goal to get its progress
      const currentGoal = savingGoals.find(goal => goal.id === id);
      if (!currentGoal) throw new Error("Goal not found");
      
      let updateData: any = {};
      let recoveredAmount = 0;
      
      if (achieved) {
        // When marking as achieved, just set achieved flag
        updateData = { 
          achieved: true,
        };
      } else {
        // When unmarking as achieved, restore progress
        updateData = { 
          achieved: false,
          // Use the progress if available
          progress: currentGoal.previousProgress || 0
        };
        
        // Calculate the amount to recover (current progress - previous progress)
        recoveredAmount = currentGoal.progress - (currentGoal.previousProgress || 0);
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
        previousProgress: currentGoal.progress || 0, // Store current progress
        recoveredAmount // Add recovered amount to the return object
      } as SavingGoal & { recoveredAmount: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', userId] });
      
      // If we recovered any savings when toggling from achieved to not achieved
      if (data.recoveredAmount > 0) {
        // Update recovered savings amount
        setRecoveredSavings(prev => prev + data.recoveredAmount);
        
        toast({
          title: "Goal reactivated",
          description: `You've reactivated your goal: ${data.purpose} and recovered $${data.recoveredAmount.toFixed(2)} in savings.`,
        });
      } else if (data.achieved) {
        toast({
          title: "Goal achieved!",
          description: `Congratulations on achieving your goal: ${data.purpose}`
        });
      } else {
        toast({
          title: "Goal reactivated",
          description: `You've reactivated your goal: ${data.purpose}.`,
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

  // Delete saving goal mutation - updated to recover all progress
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
        recoveredAmount: progressAmount,
        purpose: goalToDelete.purpose
      };
    },
    onSuccess: ({ id, recoveredAmount, purpose }) => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', userId] });
      
      // Save the recovered amount to state for other components to use
      if (recoveredAmount > 0) {
        setRecoveredSavings(prev => prev + recoveredAmount);
        
        toast({
          title: "Saving goal deleted",
          description: `Your saving goal "${purpose}" has been removed and $${recoveredAmount.toFixed(2)} has been returned to your available savings`,
        });
      } else {
        toast({
          title: "Saving goal deleted",
          description: `Your saving goal "${purpose}" has been removed`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting goal",
        description: error.message || "Failed to delete saving goal",
        variant: "destructive",
      });
    },
  });

  // Distribute savings mutation - modified to track remaining savings
  const distributeSavingsMutation = useMutation({
    mutationFn: async ({ amount, goalId, monthKey }: { amount: number; goalId: string; monthKey: string }) => {
      if (!userId) throw new Error("User not authenticated");
      
      // Get the specific goal
      const goal = savingGoals.find(g => g.id === goalId);
      if (!goal) throw new Error("Goal not found");
      if (goal.achieved) throw new Error("Cannot distribute to an achieved goal");
      
      // Calculate how much to add
      const remaining = goal.amount - goal.progress;
      const amountToAdd = Math.min(amount, remaining);
      
      // Round to 2 decimal places
      const roundedAmount = Math.round(amountToAdd * 100) / 100;
      
      const newProgress = goal.progress + roundedAmount;
      const achieved = newProgress >= goal.amount;
      
      // Update data object
      const updateData: any = {
        progress: newProgress,
        achieved: achieved
      };
      
      // Update the goal in the database
      const { data, error } = await supabase
        .from('saving_goals')
        .update(updateData)
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();
        
      if (error) throw error;
      
      // Calculate leftover savings (amount - amountToAdd)
      const leftoverSavings = Math.max(0, amount - amountToAdd);
      
      return {
        ...data,
        id: data.id,
        created: new Date(data.created),
        previousProgress: goal.progress || 0,
        amountAdded: roundedAmount,
        achieved,
        monthKey,
        leftoverSavings
      } as SavingGoal & { amountAdded: number; monthKey: string; leftoverSavings: number };
    },
    onSuccess: (updatedGoal) => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', userId] });
      
      // Update distributed savings for this month
      setDistributedSavings(prev => {
        const currentDistributed = prev[updatedGoal.monthKey] || 0;
        return {
          ...prev,
          [updatedGoal.monthKey]: currentDistributed + updatedGoal.amountAdded
        };
      });
      
      if (updatedGoal.achieved) {
        toast({
          title: "Goal achieved!",
          description: `Congratulations! You've completed your saving goal: ${updatedGoal.purpose}`
        });
      } else {
        toast({
          title: "Savings contributed",
          description: `$${updatedGoal.amountAdded.toFixed(2)} has been added to your "${updatedGoal.purpose}" goal.`,
        });
      }
      
      // If there's leftover savings, show a toast notification
      if (updatedGoal.leftoverSavings > 0) {
        toast({
          title: "Savings remaining",
          description: `$${updatedGoal.leftoverSavings.toFixed(2)} is still available to distribute to other goals.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error distributing savings",
        description: error.message || "Failed to distribute savings to goal",
        variant: "destructive",
      });
    },
  });

  // New mutation to undo/reverse a savings distribution
  const reverseDistributionMutation = useMutation({
    mutationFn: async ({ goalId, monthKey, amountToReverse }: { goalId: string; monthKey: string; amountToReverse?: number }) => {
      if (!userId) throw new Error("User not authenticated");
      
      // Get the specific goal
      const goal = savingGoals.find(g => g.id === goalId);
      if (!goal) throw new Error("Goal not found");
      
      // If amount is provided, use it, otherwise reverse full progress
      const reverseAmount = amountToReverse !== undefined ? amountToReverse : goal.progress;
      
      if (reverseAmount <= 0) {
        return { 
          goal, 
          amountReversed: 0,
          monthKey 
        };
      }
      
      // Calculate new progress
      const newProgress = Math.max(0, goal.progress - reverseAmount);
      
      // Update the goal in the database
      const { data, error } = await supabase
        .from('saving_goals')
        .update({
          progress: newProgress,
          achieved: false // Reset achieved status if it was true
        })
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        goal: {
          ...data,
          id: data.id,
          created: new Date(data.created),
        },
        amountReversed: reverseAmount,
        monthKey
      };
    },
    onSuccess: ({ goal, amountReversed, monthKey }) => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', userId] });
      
      if (amountReversed > 0) {
        // Update distributed savings for this month (decrease the amount)
        setDistributedSavings(prev => {
          const currentDistributed = prev[monthKey] || 0;
          return {
            ...prev,
            [monthKey]: Math.max(0, currentDistributed - amountReversed)
          };
        });
        
        // Add the reversed amount to recovered savings
        setRecoveredSavings(prev => prev + amountReversed);
        
        toast({
          title: "Distribution reversed",
          description: `$${amountReversed.toFixed(2)} has been recovered from "${goal.purpose}" goal.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error reversing distribution",
        description: error.message || "Failed to reverse distribution",
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

  const distributeSavings = (amount: number, goalId: string, monthKey: string) => {
    distributeSavingsMutation.mutate({ amount, goalId, monthKey });
  };

  // New function to reverse a distribution
  const reverseDistribution = (goalId: string, monthKey: string, amountToReverse?: number) => {
    reverseDistributionMutation.mutate({ goalId, monthKey, amountToReverse });
  };

  // Get the remaining savings for a specific month (total - distributed)
  const getRemainingMonthSavings = (monthKey: string, totalSavings: number) => {
    const distributed = distributedSavings[monthKey] || 0;
    return Math.max(0, totalSavings - distributed);
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
    reverseDistribution, // New function exposed
    getRecoveredSavings,
    getRemainingMonthSavings, // Method to get remaining savings
  };
}

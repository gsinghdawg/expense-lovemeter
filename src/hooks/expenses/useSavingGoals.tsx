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
        previousProgress: goal.progress || 0 // Store the current progress as previous
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

  // Toggle saving goal achievement mutation - updated to restore progress on unachieved
  const toggleSavingGoalMutation = useMutation({
    mutationFn: async ({ id, achieved, monthKey }: { id: string, achieved: boolean, monthKey?: string }) => {
      if (!userId) throw new Error("User not authenticated");
      
      // Find the current goal to get its progress
      const currentGoal = savingGoals.find(goal => goal.id === id);
      if (!currentGoal) throw new Error("Goal not found");
      
      let updateData: any = {};
      let recoveredAmount = 0;
      
      if (achieved) {
        // When marking as achieved, store current progress and then set achieved flag
        updateData = { 
          achieved: true,
          // Save current progress value to previousProgress field for potential restore
          // This is an in-memory field only, not stored in database
        };
      } else {
        // When unmarking as achieved, restore progress to previous state and recover the savings
        recoveredAmount = currentGoal.progress || 0;
        
        updateData = { 
          achieved: false,
          // Reset progress back to 0 when unmarking
          progress: 0
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
        previousProgress: currentGoal.progress || 0, // Store current progress value
        recoveredAmount: !achieved ? recoveredAmount : 0, // Amount to add back to available savings
        monthKey: monthKey || '' // Pass the monthKey to identify which month's distribution to revert
      } as SavingGoal & { recoveredAmount: number, monthKey: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', userId] });
      
      // If unmarking as achieved, add the recovered amount to available savings
      if (!data.achieved && data.recoveredAmount > 0) {
        setRecoveredSavings(prev => prev + data.recoveredAmount);
        
        // If we have a specific monthKey, update that month's distributed savings
        if (data.monthKey) {
          setDistributedSavings(prev => {
            const currentDistributed = prev[data.monthKey] || 0;
            const newDistributed = Math.max(0, currentDistributed - data.recoveredAmount);
            
            return {
              ...prev,
              [data.monthKey]: newDistributed
            };
          });
        }
        
        toast({
          title: "Goal reactivated",
          description: `You've reactivated your goal: ${data.purpose}. $${data.recoveredAmount.toFixed(2)} has been returned to your available savings.`,
        });
      } else if (data.achieved) {
        toast({
          title: "Goal achieved!",
          description: `Congratulations on achieving your goal: ${data.purpose}`
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

  // Delete saving goal mutation - updated to recover progress for a specific month
  // This mutation is now also used for the "reverse contributions" functionality
  const deleteSavingGoalMutation = useMutation({
    mutationFn: async ({ id, monthKey, keepGoal = false }: { id: string, monthKey?: string, keepGoal?: boolean }) => {
      if (!userId) throw new Error("User not authenticated");
      
      // First, get the goal to recover its progress amount
      const goalToDelete = savingGoals.find(goal => goal.id === id);
      if (!goalToDelete) throw new Error("Goal not found");
      
      // Store the progress amount to return to available savings
      const progressAmount = goalToDelete.progress || 0;
      
      // If we're just reversing contributions (keepGoal=true), update goal instead of deleting
      if (keepGoal) {
        const { error } = await supabase
          .from('saving_goals')
          .update({
            progress: 0,  // Reset progress to 0
            achieved: false // Ensure it's not marked as achieved
          })
          .eq('id', id)
          .eq('user_id', userId);
          
        if (error) throw error;
      } else {
        // Otherwise, delete the goal
        const { error } = await supabase
          .from('saving_goals')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
          
        if (error) throw error;
      }
      
      // Return both the deleted/updated ID and the amount to recover, plus the monthKey
      return { 
        id, 
        recoveredAmount: progressAmount,
        monthKey: monthKey || '',
        purpose: goalToDelete.purpose, // Include purpose for toast notification
        keepGoal: keepGoal // Track if we're keeping the goal
      };
    },
    onSuccess: ({ id, recoveredAmount, monthKey, purpose, keepGoal }) => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', userId] });
      
      // Save the recovered amount to state for other components to use
      setRecoveredSavings(prev => prev + recoveredAmount);
      
      // If we have a specific monthKey, update that month's distributed savings
      if (monthKey) {
        setDistributedSavings(prev => {
          const currentDistributed = prev[monthKey] || 0;
          const newDistributed = Math.max(0, currentDistributed - recoveredAmount);
          
          return {
            ...prev,
            [monthKey]: newDistributed
          };
        });
      }
      
      if (keepGoal) {
        toast({
          title: "Contributions reversed",
          description: recoveredAmount > 0 
            ? `$${recoveredAmount.toFixed(2)} has been returned to your available savings for ${monthKey.replace('-', '/')} while keeping your "${purpose}" goal active.`
            : `Your goal "${purpose}" had no contributions to reverse.`,
        });
      } else {
        toast({
          title: "Saving goal deleted",
          description: recoveredAmount > 0 
            ? `Your saving goal "${purpose}" has been removed and $${recoveredAmount.toFixed(2)} has been returned to your available savings for ${monthKey.replace('-', '/')}`
            : `Your saving goal "${purpose}" has been removed`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error with goal",
        description: error.message || "Failed to process your request",
        variant: "destructive",
      });
    },
  });

  // Distribute savings mutation
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

  // Wrapper functions
  const addSavingGoal = (goal: Omit<SavingGoal, 'id' | 'created' | 'achieved' | 'progress'>) => {
    addSavingGoalMutation.mutate(goal);
  };

  const toggleSavingGoal = (id: string, achieved: boolean, monthKey?: string) => {
    toggleSavingGoalMutation.mutate({ id, achieved, monthKey });
  };

  const deleteSavingGoal = (id: string, monthKey?: string, keepGoal: boolean = false) => {
    deleteSavingGoalMutation.mutate({ id, monthKey, keepGoal });
  };

  const reverseSavingGoal = (id: string, monthKey?: string) => {
    // Use the delete mutation but pass keepGoal=true
    deleteSavingGoalMutation.mutate({ id, monthKey, keepGoal: true });
  };

  const distributeSavings = (amount: number, goalId: string, monthKey: string) => {
    distributeSavingsMutation.mutate({ amount, goalId, monthKey });
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
    reverseSavingGoal,
    distributeSavings,
    getRecoveredSavings,
    getRemainingMonthSavings,
  };
}

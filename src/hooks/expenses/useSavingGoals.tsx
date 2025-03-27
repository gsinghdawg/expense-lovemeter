
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
        created: new Date(goal.created)
      })) as SavingGoal[];
    },
    enabled: !!userId,
  });

  // Add saving goal mutation
  const addSavingGoalMutation = useMutation({
    mutationFn: async (newGoal: Omit<SavingGoal, 'id' | 'created' | 'achieved'>) => {
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
          user_id: userId
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        ...data,
        id: data.id,
        created: new Date(data.created)
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
        created: new Date(data.created)
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

  // Wrapper functions
  const addSavingGoal = (goal: Omit<SavingGoal, 'id' | 'created' | 'achieved'>) => {
    addSavingGoalMutation.mutate(goal);
  };

  const toggleSavingGoal = (id: string, achieved: boolean) => {
    toggleSavingGoalMutation.mutate({ id, achieved });
  };

  const deleteSavingGoal = (id: string) => {
    deleteSavingGoalMutation.mutate(id);
  };

  return {
    savingGoals,
    isLoadingSavingGoals,
    addSavingGoal,
    toggleSavingGoal,
    deleteSavingGoal,
  };
}

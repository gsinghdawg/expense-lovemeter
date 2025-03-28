
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SavingGoal } from "@/types/expense";
import { v4 as uuidv4 } from "uuid";

export function useSavingGoals() {
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchSavingGoals();
    }
  }, [user]);

  async function fetchSavingGoals() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saving_goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created', { ascending: false });

      if (error) {
        throw error;
      }

      // Map the data to include previous_progress property
      const goalsWithPreviousProgress = data.map(goal => ({
        ...goal,
        previous_progress: goal.progress // Store the current progress as previous_progress
      }));

      setSavingGoals(goalsWithPreviousProgress);
    } catch (error) {
      console.error('Error fetching saving goals:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function addSavingGoal(goalData: { amount: number; purpose: string }) {
    if (!user) return null;

    try {
      const newGoal = {
        id: uuidv4(),
        user_id: user.id,
        amount: goalData.amount,
        purpose: goalData.purpose,
        progress: 0,
        previous_progress: 0,
        achieved: false,
        created: new Date().toISOString(),
      };

      const { error } = await supabase.from('saving_goals').insert(newGoal);

      if (error) {
        throw error;
      }

      setSavingGoals(prev => [newGoal, ...prev]);
      toast({
        title: "Success",
        description: "Saving goal created successfully",
      });

      return newGoal;
    } catch (error) {
      console.error('Error adding saving goal:', error);
      toast({
        title: "Error",
        description: "Failed to create saving goal",
        variant: "destructive",
      });
      return null;
    }
  }

  async function toggleSavingGoal(id: string, achieved: boolean) {
    if (!user) return;

    try {
      // Find the goal in the current state
      const goal = savingGoals.find(g => g.id === id);
      if (!goal) return;

      let updates = {};
      
      if (achieved) {
        // When marking as achieved, store current progress as previous_progress
        updates = {
          achieved: true,
          previous_progress: goal.progress
        };
      } else {
        // When unmarking, restore previous progress
        updates = {
          achieved: false,
          progress: goal.previous_progress || 0
        };
      }

      const { error } = await supabase
        .from('saving_goals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setSavingGoals(prev =>
        prev.map(g =>
          g.id === id
            ? { ...g, ...updates }
            : g
        )
      );
    } catch (error) {
      console.error('Error toggling saving goal:', error);
      toast({
        title: "Error",
        description: "Failed to update saving goal",
        variant: "destructive",
      });
    }
  }

  async function deleteSavingGoal(id: string) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saving_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setSavingGoals(prev => prev.filter(g => g.id !== id));
      toast({
        title: "Success",
        description: "Saving goal deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting saving goal:', error);
      toast({
        title: "Error",
        description: "Failed to delete saving goal",
        variant: "destructive",
      });
    }
  }

  async function distributeSavings(goalIds: string[], amount: number) {
    if (!user || goalIds.length === 0 || amount <= 0) return;

    try {
      // Filter goals that should receive savings
      const selectedGoals = savingGoals.filter(g => goalIds.includes(g.id) && !g.achieved);
      
      if (selectedGoals.length === 0) return;
      
      // Calculate how much each goal should receive (evenly distribute)
      const amountPerGoal = amount / selectedGoals.length;
      
      // Update each goal's progress
      const updatedGoals = selectedGoals.map(goal => {
        const newProgress = goal.progress + amountPerGoal;
        
        // Check if goal is now achieved
        const isAchieved = newProgress >= goal.amount;
        
        return {
          ...goal,
          progress: isAchieved ? goal.amount : newProgress,
          previous_progress: goal.progress, // Store previous progress
          achieved: isAchieved,
        };
      });
      
      // Prepare updates for Supabase
      const updates = updatedGoals.map(goal => ({
        id: goal.id,
        progress: goal.progress,
        previous_progress: goal.previous_progress,
        achieved: goal.achieved,
      }));
      
      // Update all goals in a transaction (or as close as we can get)
      for (const update of updates) {
        const { error } = await supabase
          .from('saving_goals')
          .update({
            progress: update.progress,
            previous_progress: update.previous_progress,
            achieved: update.achieved
          })
          .eq('id', update.id)
          .eq('user_id', user.id);
        
        if (error) {
          throw error;
        }
      }
      
      // Update state
      setSavingGoals(prev => 
        prev.map(g => {
          const updated = updatedGoals.find(u => u.id === g.id);
          return updated ? updated : g;
        })
      );
      
      toast({
        title: "Success",
        description: `Distributed $${amount.toFixed(2)} across ${updatedGoals.length} saving goals`,
      });
      
    } catch (error) {
      console.error('Error distributing savings:', error);
      toast({
        title: "Error",
        description: "Failed to distribute savings",
        variant: "destructive",
      });
    }
  }

  return {
    savingGoals,
    isLoading,
    addSavingGoal,
    toggleSavingGoal,
    deleteSavingGoal,
    distributeSavings,
  };
}

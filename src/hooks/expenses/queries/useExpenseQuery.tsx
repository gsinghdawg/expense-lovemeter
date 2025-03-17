
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Expense } from "@/types/expense";

export function useExpenseQuery(userId: string | undefined) {
  // Fetch expenses from Supabase
  return useQuery({
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
}

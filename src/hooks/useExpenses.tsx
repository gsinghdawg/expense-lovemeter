import { useState, useEffect } from "react";
import { Expense, ExpenseCategory, BudgetGoal, BudgetGoalHistory } from "@/types/expense";
import { defaultCategories } from "@/data/categories";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSupabase } from "@/providers/SupabaseProvider";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>(defaultCategories);
  const [budgetGoal, setBudgetGoal] = useState<BudgetGoal>(() => {
    const now = new Date();
    return { amount: null, month: now.getMonth(), year: now.getFullYear() };
  });
  const [budgetHistory, setBudgetHistory] = useState<BudgetGoalHistory[]>(() => {
    const now = new Date();
    return [{ 
      amount: null, 
      month: now.getMonth(), 
      year: now.getFullYear(),
      startDate: now
    }];
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useSupabase();

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setExpenses([]);
      setCategories(defaultCategories);
      const now = new Date();
      setBudgetGoal({ amount: null, month: now.getMonth(), year: now.getFullYear() });
      setBudgetHistory([{ 
        amount: null, 
        month: now.getMonth(), 
        year: now.getFullYear(),
        startDate: now
      }]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`);
      
      if (categoriesError) throw categoriesError;
      
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id);
      
      if (expensesError) throw expensesError;

      const { data: savingsData, error: savingsError } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (savingsError) throw savingsError;

      if (categoriesData && categoriesData.length > 0) {
        const processedCategories = categoriesData.map(cat => ({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          isDefault: cat.is_default || false
        }));
        setCategories(processedCategories);
      } else {
        for (const category of defaultCategories) {
          await supabase.from('categories').insert({
            name: category.name,
            color: category.color,
            is_default: true
          });
        }
        setCategories(defaultCategories);
      }

      if (expensesData) {
        const processedExpenses = expensesData.map(exp => ({
          id: exp.id,
          date: new Date(exp.date),
          amount: Number(exp.amount),
          description: exp.description || '',
          categoryId: exp.category_id,
          type: exp.type
        }));
        setExpenses(processedExpenses);
      }

      if (savingsData && savingsData.length > 0) {
        const latestGoal = savingsData[0];
        const date = new Date(latestGoal.month);
        
        setBudgetGoal({
          amount: Number(latestGoal.amount),
          month: date.getMonth(),
          year: date.getFullYear()
        });
        
        const processedHistory = savingsData.map(goal => {
          const goalDate = new Date(goal.month);
          return {
            amount: Number(goal.amount),
            month: goalDate.getMonth(),
            year: goalDate.getFullYear(),
            startDate: new Date(goal.created_at)
          };
        });
        
        setBudgetHistory(processedHistory);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading data",
        description: "There was a problem loading your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addExpense = async (expense: Omit<Expense, "id">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          date: expense.date.toISOString().split('T')[0],
          amount: expense.amount,
          description: expense.description,
          category_id: expense.categoryId,
          type: expense.type,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      const newExpense = {
        id: data.id,
        date: new Date(data.date),
        amount: Number(data.amount),
        description: data.description,
        categoryId: data.category_id,
        type: data.type
      };

      setExpenses([...expenses, newExpense]);
      
      toast({
        title: "Expense added",
        description: `$${expense.amount.toFixed(2)} - ${expense.description}`,
      });
      
      return newExpense;
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error adding expense",
        description: "There was a problem adding your expense. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateExpense = async (expense: Expense) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          date: expense.date.toISOString().split('T')[0],
          amount: expense.amount,
          description: expense.description,
          category_id: expense.categoryId,
          type: expense.type
        })
        .eq('id', expense.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setExpenses(expenses.map(e => e.id === expense.id ? expense : e));
      
      toast({
        title: "Expense updated",
        description: `$${expense.amount.toFixed(2)} - ${expense.description}`,
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Error updating expense",
        description: "There was a problem updating your expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setExpenses(expenses.filter(e => e.id !== id));
      
      toast({
        title: "Expense deleted",
        description: "The expense has been removed",
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error deleting expense",
        description: "There was a problem deleting your expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateBudgetGoal = async (newBudget: BudgetGoal) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('savings_goals')
        .insert({
          amount: newBudget.amount,
          month: new Date(newBudget.year, newBudget.month, 1).toISOString().split('T')[0],
          user_id: user.id
        });

      if (error) throw error;

      setBudgetGoal(newBudget);
      
      const now = new Date();
      const newBudgetHistory: BudgetGoalHistory = {
        ...newBudget,
        startDate: now
      };
      
      setBudgetHistory([...budgetHistory, newBudgetHistory]);
      
      toast({
        title: "Budget updated",
        description: newBudget.amount === null 
          ? "Monthly budget cleared" 
          : `Monthly budget set to $${newBudget.amount.toFixed(2)}`,
      });
    } catch (error) {
      console.error('Error updating budget:', error);
      toast({
        title: "Error updating budget",
        description: "There was a problem updating your budget. Please try again.",
        variant: "destructive",
      });
    }
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

  const addCategory = async (category: Omit<ExpenseCategory, "id">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          color: category.color,
          is_default: false,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      const newCategory = {
        id: data.id,
        name: data.name,
        color: data.color,
        isDefault: data.is_default
      };

      setCategories([...categories, newCategory]);
      
      toast({
        title: "Category added",
        description: `${category.name} category created`,
      });
      
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error adding category",
        description: "There was a problem adding your category. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateCategory = async (category: ExpenseCategory) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: category.name,
          color: category.color
        })
        .eq('id', category.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCategories(categories.map(c => c.id === category.id ? category : c));
      
      toast({
        title: "Category updated",
        description: `${category.name} category updated`,
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error updating category",
        description: "There was a problem updating your category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return false;

    const inUse = expenses.some(e => e.categoryId === id);
    if (inUse) {
      toast({
        title: "Cannot delete category",
        description: "This category is being used by some expenses",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCategories(categories.filter(c => c.id !== id));
      
      toast({
        title: "Category deleted",
        description: "The category has been removed",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error deleting category",
        description: "There was a problem deleting your category. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getCategoryById = (id: string) => {
    return categories.find(c => c.id === id) || defaultCategories[1];
  };

  return {
    expenses,
    categories,
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

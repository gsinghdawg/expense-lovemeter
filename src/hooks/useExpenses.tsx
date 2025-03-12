
import { useState, useEffect } from "react";
import { Expense, ExpenseCategory, BudgetGoal, BudgetGoalHistory } from "@/types/expense";
import { defaultCategories } from "@/data/categories";
import { toast } from "@/hooks/use-toast";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem("expenses");
    if (saved) {
      try {
        // Convert the date strings back to Date objects
        return JSON.parse(saved).map((expense: any) => ({
          ...expense,
          date: new Date(expense.date),
        }));
      } catch (e) {
        console.error("Failed to parse expenses", e);
        return [];
      }
    }
    return [];
  });

  const [categories, setCategories] = useState<ExpenseCategory[]>(() => {
    const saved = localStorage.getItem("categories");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse categories", e);
        return defaultCategories;
      }
    }
    return defaultCategories;
  });

  const [budgetGoal, setBudgetGoal] = useState<BudgetGoal>(() => {
    const saved = localStorage.getItem("budgetGoal");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse budget goal", e);
        const now = new Date();
        return { amount: 1000, month: now.getMonth(), year: now.getFullYear() };
      }
    }
    const now = new Date();
    return { amount: 1000, month: now.getMonth(), year: now.getFullYear() };
  });

  const [budgetHistory, setBudgetHistory] = useState<BudgetGoalHistory[]>(() => {
    const saved = localStorage.getItem("budgetHistory");
    if (saved) {
      try {
        // Convert the date strings back to Date objects
        return JSON.parse(saved).map((budget: any) => ({
          ...budget,
          startDate: new Date(budget.startDate),
        }));
      } catch (e) {
        console.error("Failed to parse budget history", e);
        const now = new Date();
        return [{ 
          amount: 1000, 
          month: now.getMonth(), 
          year: now.getFullYear(),
          startDate: now
        }];
      }
    }
    const now = new Date();
    return [{ 
      amount: 1000, 
      month: now.getMonth(), 
      year: now.getFullYear(),
      startDate: now
    }];
  });

  // Save to localStorage whenever expenses, categories, or budgetGoal change
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("budgetGoal", JSON.stringify(budgetGoal));
  }, [budgetGoal]);
  
  useEffect(() => {
    localStorage.setItem("budgetHistory", JSON.stringify(budgetHistory));
  }, [budgetHistory]);

  const addExpense = (expense: Omit<Expense, "id">) => {
    const newExpense = {
      ...expense,
      id: crypto.randomUUID(),
    };
    setExpenses([...expenses, newExpense]);
    toast({
      title: "Expense added",
      description: `$${expense.amount.toFixed(2)} - ${expense.description}`,
    });
    return newExpense;
  };

  const updateExpense = (expense: Expense) => {
    setExpenses(expenses.map(e => e.id === expense.id ? expense : e));
    toast({
      title: "Expense updated",
      description: `$${expense.amount.toFixed(2)} - ${expense.description}`,
    });
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
    toast({
      title: "Expense deleted",
      description: "The expense has been removed",
    });
  };

  const updateBudgetGoal = (newBudget: BudgetGoal) => {
    setBudgetGoal(newBudget);
    
    // Add to budget history
    const now = new Date();
    const newBudgetHistory: BudgetGoalHistory = {
      ...newBudget,
      startDate: now
    };
    
    setBudgetHistory([...budgetHistory, newBudgetHistory]);
    
    toast({
      title: "Budget updated",
      description: `Monthly budget set to $${newBudget.amount.toFixed(2)}`,
    });
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

  // Get budget for a specific month and year
  const getBudgetForMonth = (month: number, year: number) => {
    // Sort budget history by date (newest first)
    const sortedHistory = [...budgetHistory].sort((a, b) => 
      b.startDate.getTime() - a.startDate.getTime()
    );
    
    // Find the most recent budget that was set before or during the specified month
    for (const budget of sortedHistory) {
      const budgetDate = new Date(budget.year, budget.month);
      const targetDate = new Date(year, month);
      
      if (budgetDate <= targetDate) {
        return budget.amount;
      }
    }
    
    // If no budget found (unlikely), return the oldest budget
    return sortedHistory.length > 0 
      ? sortedHistory[sortedHistory.length - 1].amount 
      : 1000; // Default fallback
  };

  // Additional functions
  const addCategory = (category: Omit<ExpenseCategory, "id">) => {
    const newCategory = {
      ...category,
      id: crypto.randomUUID(),
    };
    setCategories([...categories, newCategory]);
    toast({
      title: "Category added",
      description: `${category.name} category created`,
    });
    return newCategory;
  };

  const updateCategory = (category: ExpenseCategory) => {
    setCategories(categories.map(c => c.id === category.id ? category : c));
    toast({
      title: "Category updated",
      description: `${category.name} category updated`,
    });
  };

  const deleteCategory = (id: string) => {
    // Check if category is in use
    const inUse = expenses.some(e => e.categoryId === id);
    if (inUse) {
      toast({
        title: "Cannot delete category",
        description: "This category is being used by some expenses",
        variant: "destructive",
      });
      return false;
    }
    
    setCategories(categories.filter(c => c.id !== id));
    toast({
      title: "Category deleted",
      description: "The category has been removed",
    });
    return true;
  };

  const getCategoryById = (id: string) => {
    return categories.find(c => c.id === id) || defaultCategories[7]; // Return "Other" if not found
  };

  return {
    expenses,
    categories,
    budgetGoal,
    budgetHistory,
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

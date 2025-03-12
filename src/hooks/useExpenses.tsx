
import { useState, useEffect } from "react";
import { Expense, ExpenseCategory } from "@/types/expense";
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

  // Save to localStorage whenever expenses or categories change
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);

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
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
  };
}

export type ExpenseCategory = {
  id: string;
  name: string;
  color: string;
};

export type Expense = {
  id: string;
  amount: number;
  description: string;
  date: Date;
  categoryId: string;
};

export type BudgetGoal = {
  amount: number | null;
  month: number; // 0-11 (Jan-Dec)
  year: number;
};

// New type for saving goals
export type SavingGoal = {
  id: string;
  amount: number;
  purpose: string;
  created: Date;
  achieved?: boolean;
  progress: number; // Added progress field
};

// History of budget goals
export type BudgetGoalHistory = {
  amount: number | null;
  month: number; // 0-11 (Jan-Dec)
  year: number;
  startDate: Date;
};

// Extending DatabaseExpense interface for database interaction
export interface DatabaseExpense extends Omit<Expense, 'date'> {
  date: string; // Supabase stores dates as ISO strings
  user_id: string;
}

// Extending DatabaseCategory interface for database interaction
export interface DatabaseCategory extends Omit<ExpenseCategory, 'id'> {
  id?: string;
  user_id: string;
  icon: string;
}

// Extending DatabaseBudgetGoal interface for database interaction
export interface DatabaseBudgetGoal extends BudgetGoal {
  id?: string;
  user_id: string;
}

// New database type for saving goals
export interface DatabaseSavingGoal {
  id: string; // Changed from optional to required to match SavingGoal
  user_id: string;
  amount: number;
  purpose: string;
  created: string; // Supabase stores dates as ISO strings
  achieved: boolean;
  progress: number; // Added progress field
}

// Extending DatabaseBudgetGoalHistory interface for database interaction
export interface DatabaseBudgetGoalHistory extends Omit<BudgetGoalHistory, 'startDate'> {
  id?: string;
  user_id: string;
  start_date: string; // Supabase stores dates as ISO strings
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  user_id?: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: Date | string;
  categoryId: string;
  user_id?: string;
}

export interface BudgetGoal {
  id?: string;
  amount: number;
  month: string;
  year: string;
  user_id?: string;
}

export interface SavingGoal {
  id: string;
  user_id: string;
  amount: number;
  purpose: string;
  progress: number;
  previous_progress: number;
  achieved: boolean;
  created: Date | string;
}

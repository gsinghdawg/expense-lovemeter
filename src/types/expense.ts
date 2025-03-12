
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
  amount: number;
  month: number; // 0-11 (Jan-Dec)
  year: number;
};


import React from 'react';
import { Expense, ExpenseCategory } from '@/types/expense';
import { ExpenseItem } from '@/components/ExpenseItem';
import { format, isSameDay, isSameMonth, isSameYear } from 'date-fns';

type ExpenseListGroupProps = {
  date: Date;
  expenses: Expense[];
  getCategoryById: (id: string) => ExpenseCategory;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
};

export function ExpenseListGroup({
  date,
  expenses,
  getCategoryById,
  onEditExpense,
  onDeleteExpense,
}: ExpenseListGroupProps) {
  const getDateHeaderText = (date: Date) => {
    const today = new Date();
    
    if (isSameDay(date, today)) {
      return 'Today';
    } 
    
    if (isSameDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), date)) {
      return 'Yesterday';
    }
    
    if (isSameYear(date, new Date()) && isSameMonth(date, new Date())) {
      return `This Month • ${format(date, 'EEEE, MMMM d')}`;
    }
    
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background/90 backdrop-blur-sm py-2">
        {getDateHeaderText(date)}
      </h3>
      <div className="space-y-3">
        {expenses.map((expense) => (
          <ExpenseItem
            key={expense.id}
            expense={{
              ...expense,
              date: expense.date instanceof Date ? expense.date : new Date(expense.date)
            }}
            category={getCategoryById(expense.categoryId)}
            onEdit={onEditExpense}
            onDelete={onDeleteExpense}
          />
        ))}
      </div>
    </div>
  );
}

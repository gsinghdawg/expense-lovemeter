
import React from 'react';
import { Expense, ExpenseCategory } from '@/types/expense';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ExpenseForm } from '@/components/ExpenseForm';

type ExpenseEditDialogProps = {
  editingExpense: Expense | null;
  setEditingExpense: (expense: Expense | null) => void;
  onUpdateExpense: (expense: {
    amount: number;
    description: string;
    date: Date;
    categoryId: string;
  }) => void;
  categories: ExpenseCategory[];
};

export function ExpenseEditDialog({
  editingExpense,
  setEditingExpense,
  onUpdateExpense,
  categories,
}: ExpenseEditDialogProps) {
  const handleUpdateExpense = (data: {
    amount: number;
    description: string;
    date: Date;
    categoryId: string;
  }) => {
    if (editingExpense) {
      console.log("Updating expense with data:", data);
      console.log("Date from form:", data.date);
      // Ensure the date is a proper Date object
      const updatedExpense = {
        ...editingExpense,
        ...data,
        date: data.date instanceof Date ? data.date : new Date(data.date)
      };
      console.log("Final updated expense:", updatedExpense);
      onUpdateExpense(updatedExpense);
      setEditingExpense(null);
    }
  };

  return (
    <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Make changes to your expense below
          </DialogDescription>
        </DialogHeader>
        {editingExpense && (
          <ExpenseForm
            categories={categories}
            onSubmit={handleUpdateExpense}
            defaultValues={{
              amount: editingExpense.amount,
              description: editingExpense.description,
              date: editingExpense.date instanceof Date ? 
                editingExpense.date : 
                new Date(editingExpense.date),
              categoryId: editingExpense.categoryId,
            }}
            submitLabel="Update Expense"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

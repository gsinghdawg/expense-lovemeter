
import { useState } from "react";
import { Expense, ExpenseCategory, SavingGoal } from "@/types/expense";
import { ExpenseItem } from "@/components/ExpenseItem";
import { ExpenseForm } from "@/components/ExpenseForm";
import { SavingGoalSection } from "@/components/SavingGoalSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface RecentTransactionsProps {
  expenses: Expense[];
  savingGoals: SavingGoal[];
  categories: ExpenseCategory[];
  getCategoryById: (id: string) => ExpenseCategory;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onAddSavingGoal: (goal: { amount: number; purpose: string }) => void;
  onToggleSavingGoal: (id: string, achieved: boolean) => void;
  onDeleteSavingGoal: (id: string) => void;
  onDistributeSavings: (goalIds: string[], amount: number) => void;
  monthEndSavings: number;
  limit?: number;
}

export function RecentTransactions({
  expenses,
  savingGoals,
  categories,
  getCategoryById,
  onEditExpense,
  onDeleteExpense,
  onAddSavingGoal,
  onToggleSavingGoal,
  onDeleteSavingGoal,
  onDistributeSavings,
  monthEndSavings,
  limit = 3
}: RecentTransactionsProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const isMobile = useIsMobile();
  
  // For debugging
  console.log("RecentTransactions isMobile:", isMobile);
  console.log("RecentTransactions monthEndSavings:", monthEndSavings);
  console.log("RecentTransactions savingGoals:", savingGoals);
  
  // Get the most recent expenses
  const recentExpenses = [...expenses]
    .sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, limit);

  const handleEdit = (expense: Expense) => {
    setEditingExpense({
      ...expense,
      date: expense.date instanceof Date ? expense.date : new Date(expense.date)
    });
  };

  const handleSaveEdit = (updatedExpense: Omit<Expense, "id">) => {
    if (editingExpense) {
      onEditExpense({
        id: editingExpense.id,
        ...updatedExpense
      });
      setEditingExpense(null);
    }
  };

  const handleCloseDialog = () => {
    setEditingExpense(null);
  };

  const handleDistributeSavings = (goalIds: string[], amount: number) => {
    console.log('RecentTransactions handleDistributeSavings:', { goalIds, amount });
    onDistributeSavings(goalIds, amount);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentExpenses.length > 0 ? (
            recentExpenses.map(expense => (
              <ExpenseItem
                key={expense.id}
                expense={{
                  ...expense,
                  date: expense.date instanceof Date ? expense.date : new Date(expense.date)
                }}
                category={getCategoryById(expense.categoryId)}
                onEdit={handleEdit}
                onDelete={onDeleteExpense}
                alwaysShowActions={isMobile} // Always show action buttons on mobile
              />
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No recent transactions
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saving Goals Section */}
      <div className="mt-6">
        <SavingGoalSection
          goals={savingGoals}
          onAddGoal={onAddSavingGoal}
          onToggleGoal={onToggleSavingGoal}
          onDeleteGoal={onDeleteSavingGoal}
          onDistributeSavings={handleDistributeSavings}
          monthEndSavings={monthEndSavings}
        />
      </div>

      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              categories={categories}
              onSubmit={handleSaveEdit}
              defaultValues={{
                amount: editingExpense.amount,
                description: editingExpense.description,
                date: editingExpense.date instanceof Date 
                  ? editingExpense.date 
                  : new Date(editingExpense.date),
                categoryId: editingExpense.categoryId
              }}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

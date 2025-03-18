
import { useState } from "react";
import { Expense, ExpenseCategory } from "@/types/expense";
import { ExpenseItem } from "@/components/ExpenseItem";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentTransactionsProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  getCategoryById: (id: string) => ExpenseCategory;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  limit?: number;
}

export function RecentTransactions({
  expenses,
  categories,
  getCategoryById,
  onEditExpense,
  onDeleteExpense,
  limit = 3
}: RecentTransactionsProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const isMobile = useIsMobile();
  
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          {recentExpenses.length > 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              <span>Scroll horizontally to see more</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {recentExpenses.length > 0 ? (
            <ScrollArea orientation="horizontal" className="w-full px-4">
              <div className="flex space-x-4 pb-4">
                {recentExpenses.map(expense => (
                  <div key={expense.id} className="min-w-[300px] md:min-w-[350px]">
                    <ExpenseItem
                      expense={{
                        ...expense,
                        date: expense.date instanceof Date ? expense.date : new Date(expense.date)
                      }}
                      category={getCategoryById(expense.categoryId)}
                      onEdit={handleEdit}
                      onDelete={onDeleteExpense}
                      alwaysShowActions={isMobile}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No recent transactions
            </div>
          )}
        </CardContent>
      </Card>

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

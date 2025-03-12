
import { useState } from "react";
import { Expense, ExpenseCategory } from "@/types/expense";
import { ExpenseItem } from "@/components/ExpenseItem";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ExpenseListProps = {
  expenses: Expense[];
  categories: ExpenseCategory[];
  getCategoryById: (id: string) => ExpenseCategory;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
};

export function ExpenseList({
  expenses,
  categories,
  getCategoryById,
  onUpdateExpense,
  onDeleteExpense,
}: ExpenseListProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterText, setFilterText] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleUpdateExpense = (data: {
    amount: number;
    description: string;
    date: Date;
    categoryId: string;
  }) => {
    if (editingExpense) {
      onUpdateExpense({
        ...editingExpense,
        ...data,
      });
      setEditingExpense(null);
    }
  };

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesText = expense.description
      .toLowerCase()
      .includes(filterText.toLowerCase());
    const matchesCategory = filterCategory
      ? expense.categoryId === filterCategory
      : true;
    return matchesText && matchesCategory;
  });

  // Sort expenses by date (most recent first)
  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Search expenses..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="sm:flex-1"
        />
        <Select
          value={filterCategory}
          onValueChange={setFilterCategory}
        >
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sortedExpenses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No expenses found. Add your first expense!
        </div>
      ) : (
        <div>
          {sortedExpenses.map((expense) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              category={getCategoryById(expense.categoryId)}
              onEdit={handleEditExpense}
              onDelete={onDeleteExpense}
            />
          ))}
        </div>
      )}

      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              categories={categories}
              onSubmit={handleUpdateExpense}
              defaultValues={{
                amount: editingExpense.amount,
                description: editingExpense.description,
                date: editingExpense.date,
                categoryId: editingExpense.categoryId,
              }}
              submitLabel="Update Expense"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

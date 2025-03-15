
import { useState } from "react";
import { Expense, ExpenseCategory } from "@/types/expense";
import { ExpenseItem } from "@/components/ExpenseItem";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isSameDay, isSameMonth, isSameYear } from "date-fns";

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
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const handleEditExpense = (expense: Expense) => {
    console.log("Editing expense:", expense);
    // Ensure the date is a proper Date object
    const expenseWithValidDate = {
      ...expense,
      date: expense.date instanceof Date ? expense.date : new Date(expense.date)
    };
    console.log("Editing expense with valid date:", expenseWithValidDate);
    setEditingExpense(expenseWithValidDate);
  };

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

  const filteredExpenses = expenses.filter((expense) => {
    const matchesText = expense.description
      .toLowerCase()
      .includes(filterText.toLowerCase());
    const matchesCategory = filterCategory === "all"
      ? true
      : expense.categoryId === filterCategory;
    return matchesText && matchesCategory;
  });

  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    }
  );

  const groupExpensesByDate = (expenses: Expense[]) => {
    const groups: { [key: string]: { date: Date; expenses: Expense[] } } = {};
    
    expenses.forEach((expense) => {
      const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
      const dateKey = format(expenseDate, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: expenseDate,
          expenses: []
        };
      }
      groups[dateKey].expenses.push(expense);
    });
    
    return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
  };
  
  const groupedExpenses = groupExpensesByDate(sortedExpenses);

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
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">All Transactions</h2>
        <div className="text-sm text-muted-foreground">
          {filteredExpenses.length} {filteredExpenses.length === 1 ? 'expense' : 'expenses'} found
        </div>
      </div>
      
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
            <SelectItem value="all">All Categories</SelectItem>
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
        <div className="space-y-6">
          {groupedExpenses.map((group) => (
            <div key={format(group.date, 'yyyy-MM-dd')} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background/90 backdrop-blur-sm py-2">
                {getDateHeaderText(group.date)}
              </h3>
              <div className="space-y-3">
                {group.expenses.map((expense) => (
                  <ExpenseItem
                    key={expense.id}
                    expense={{
                      ...expense,
                      date: expense.date instanceof Date ? expense.date : new Date(expense.date)
                    }}
                    category={getCategoryById(expense.categoryId)}
                    onEdit={handleEditExpense}
                    onDelete={onDeleteExpense}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
}

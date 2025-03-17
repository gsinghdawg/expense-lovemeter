
import { useState } from "react";
import { Expense, ExpenseCategory } from "@/types/expense";
import { format } from "date-fns";
import { ExpenseListHeader } from "./expenses/ExpenseListHeader";
import { ExpenseListFilters } from "./expenses/ExpenseListFilters";
import { ExpenseListGroup } from "./expenses/ExpenseListGroup";
import { ExpenseEditDialog } from "./expenses/ExpenseEditDialog";

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

  return (
    <div className="space-y-4">
      <ExpenseListHeader expenseCount={filteredExpenses.length} />
      
      <ExpenseListFilters
        filterText={filterText}
        filterCategory={filterCategory}
        setFilterText={setFilterText}
        setFilterCategory={setFilterCategory}
        categories={categories}
      />

      {sortedExpenses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No expenses found. Add your first expense!
        </div>
      ) : (
        <div className="space-y-6">
          {groupedExpenses.map((group) => (
            <ExpenseListGroup
              key={format(group.date, 'yyyy-MM-dd')}
              date={group.date}
              expenses={group.expenses}
              getCategoryById={getCategoryById}
              onEditExpense={handleEditExpense}
              onDeleteExpense={onDeleteExpense}
            />
          ))}
        </div>
      )}

      <ExpenseEditDialog
        editingExpense={editingExpense}
        setEditingExpense={setEditingExpense}
        onUpdateExpense={onUpdateExpense}
        categories={categories}
      />
    </div>
  );
}

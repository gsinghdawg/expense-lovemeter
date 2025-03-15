
import { Expense, ExpenseCategory } from "@/types/expense";
import { ExpenseItem } from "@/components/ExpenseItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  // Get the most recent expenses
  const recentExpenses = [...expenses]
    .sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, limit);

  return (
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
              onEdit={onEditExpense}
              onDelete={onDeleteExpense}
            />
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No recent transactions
          </div>
        )}
      </CardContent>
    </Card>
  );
}

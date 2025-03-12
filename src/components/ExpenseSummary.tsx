
import { useMemo } from "react";
import { Expense, ExpenseCategory, BudgetGoal } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Progress } from "@/components/ui/progress";

type ExpenseSummaryProps = {
  expenses: Expense[];
  categories: ExpenseCategory[];
  getCategoryById: (id: string) => ExpenseCategory;
  budgetGoal: BudgetGoal;
  currentMonthTotal: number;
};

export function ExpenseSummary({
  expenses,
  categories,
  getCategoryById,
  budgetGoal,
  currentMonthTotal,
}: ExpenseSummaryProps) {
  // Calculate total spent
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  // Calculate expenses by category
  const expensesByCategory = useMemo(() => {
    const result: Record<string, number> = {};
    
    expenses.forEach((expense) => {
      const categoryId = expense.categoryId;
      result[categoryId] = (result[categoryId] || 0) + expense.amount;
    });
    
    return Object.entries(result).map(([categoryId, amount]) => {
      const category = getCategoryById(categoryId);
      return {
        name: category.name,
        value: amount,
        color: category.color,
      };
    }).sort((a, b) => b.value - a.value); // Sort by amount (descending)
  }, [expenses, getCategoryById]);

  // Format data for the pie chart
  const pieChartData = expensesByCategory;

  // Calculate budget progress percentage
  const budgetPercentage = Math.min(Math.round((currentMonthTotal / budgetGoal.amount) * 100), 100);
  
  // Determine if over budget
  const isOverBudget = currentMonthTotal > budgetGoal.amount;

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Expense Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="text-sm font-medium">
                Budget for {months[budgetGoal.month]} {budgetGoal.year}
              </p>
              <p className="text-sm font-medium">
                ${currentMonthTotal.toFixed(2)} / ${budgetGoal.amount.toFixed(2)}
              </p>
            </div>
            <Progress 
              value={budgetPercentage} 
              className={isOverBudget ? "bg-red-200" : ""}
              indicatorClassName={isOverBudget ? "bg-red-500" : ""}
            />
            {isOverBudget && (
              <p className="text-sm text-red-500 font-medium">
                You've exceeded your monthly budget by ${(currentMonthTotal - budgetGoal.amount).toFixed(2)}
              </p>
            )}
          </div>

          {expenses.length > 0 ? (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ name, percent }) => 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${value.toFixed(2)}`} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Add expenses to see your spending breakdown
            </div>
          )}

          <div className="space-y-2">
            {pieChartData.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className="text-sm font-medium">${item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

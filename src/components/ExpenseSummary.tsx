
import React, { useMemo } from "react";
import { Expense, ExpenseCategory, BudgetGoal } from "@/types/expense";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ExpenseSummaryProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  getCategoryById: (id: string) => ExpenseCategory | undefined;
  budgetGoal: BudgetGoal;
  currentMonthTotal: number;
  getBudgetForMonth: (month: number, year: number) => number | null;
}

export const ExpenseSummary = ({
  expenses,
  categories,
  getCategoryById,
  budgetGoal,
  currentMonthTotal,
  getBudgetForMonth,
}: ExpenseSummaryProps) => {
  const monthlyBudget = budgetGoal.amount || 0;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Calculate spending as a percentage of budget
  const percentOfBudget = monthlyBudget ? Math.min(100, (currentMonthTotal / monthlyBudget) * 100) : 0;

  // Get current month's name
  const currentMonthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  // Calculate expenses by category
  const expensesByCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    // Initialize all categories with 0
    categories.forEach(category => {
      categoryTotals[category.id] = 0;
    });

    // Sum up expenses for each category
    expenses.forEach(expense => {
      const { categoryId, amount } = expense;
      if (categoryId && categoryTotals[categoryId] !== undefined) {
        categoryTotals[categoryId] += amount;
      } else if (categoryId) {
        // Handle case where categoryId exists but isn't in the predefined categories
        categoryTotals[categoryId] = amount;
      }
    });

    // Convert to array format for pie chart
    return Object.entries(categoryTotals)
      .filter(([_, value]) => value > 0) // Only include categories with expenses
      .map(([categoryId, value]) => {
        const category = getCategoryById(categoryId);
        return {
          name: category ? category.name : 'Unknown',
          value,
          color: category ? category.color : '#CCCCCC'
        };
      });
  }, [expenses, categories, getCategoryById]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Budget - {currentMonthName}</CardTitle>
          <CardDescription>
            {monthlyBudget > 0 
              ? `$${formatCurrency(currentMonthTotal)} of $${formatCurrency(monthlyBudget)}`
              : 'No budget set'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={percentOfBudget} className="h-3 mb-2" />
          <div className="text-sm text-muted-foreground">
            {monthlyBudget > 0 
              ? `${Math.round(percentOfBudget)}% of budget used`
              : 'Set a budget goal to track your spending'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
          <CardDescription>Breakdown of your spending</CardDescription>
        </CardHeader>
        <CardContent>
          {expensesByCategory.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={1}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`$${formatCurrency(value)}`, 'Amount']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-muted-foreground">No expenses recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

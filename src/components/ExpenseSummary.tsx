
import { useMemo } from "react";
import { Expense, ExpenseCategory, BudgetGoal } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { CategoryLegend } from "@/components/charts/CategoryLegend";
import { MonthlySpendingChart } from "@/components/charts/MonthlySpendingChart";
import { ChartLegend } from "@/components/charts/ChartLegend";
import { TopCategoriesChart } from "@/components/charts/TopCategoriesChart";
import { BudgetProgress } from "@/components/summary/BudgetProgress";
import { StatsGrid, Stat } from "@/components/summary/StatsGrid";

type ExpenseSummaryProps = {
  expenses: Expense[];
  categories: ExpenseCategory[];
  getCategoryById: (id: string) => ExpenseCategory;
  budgetGoal: BudgetGoal;
  currentMonthTotal: number;
  getBudgetForMonth: (month: number, year: number) => number | null;
  calculateAverageMonthlyExpense: () => number;
  totalSavings: number;
};

export function ExpenseSummary({
  expenses,
  categories,
  getCategoryById,
  budgetGoal,
  currentMonthTotal,
  getBudgetForMonth,
  calculateAverageMonthlyExpense,
  totalSavings,
}: ExpenseSummaryProps) {
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return expenses.filter(expense => {
      const expenseDate = expense.date;
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });
  }, [expenses]);

  const expensesByCategory = useMemo(() => {
    const result: Record<string, number> = {};
    const total = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    currentMonthExpenses.forEach((expense) => {
      const categoryId = expense.categoryId;
      result[categoryId] = (result[categoryId] || 0) + expense.amount;
    });
    
    return Object.entries(result).map(([categoryId, amount]) => {
      const category = getCategoryById(categoryId);
      const percentage = total > 0 ? (amount / total) * 100 : 0;
      return {
        name: category.name,
        value: amount,
        color: category.color,
        percentage: percentage
      };
    }).sort((a, b) => b.value - a.value);
  }, [currentMonthExpenses, getCategoryById]);

  const averageMonthlyExpense = calculateAverageMonthlyExpense();
  const currentMonthlyBudget = budgetGoal.amount;

  const averageMonthlySavings = useMemo(() => {
    if (currentMonthlyBudget === null) return null;
    return currentMonthlyBudget - averageMonthlyExpense;
  }, [currentMonthlyBudget, averageMonthlyExpense]);

  const handleBarClick = (data: any) => {
    if (data && data.payload) {
      const { fullMonth, year, budget, spending, savings } = data.payload;
      const message = budget === null 
        ? `${fullMonth} ${year}: No budget set. Spent $${spending.toFixed(2)}`
        : `${fullMonth} ${year}: Budget $${budget.toFixed(2)}, Spent $${spending.toFixed(2)}, ${
            savings >= 0 
              ? `Saved $${savings.toFixed(2)}` 
              : `Overspent $${Math.abs(savings).toFixed(2)}`
          }`;
          
      console.log(message);
      const { toast } = require("@/hooks/use-toast");
      toast({
        title: `${fullMonth} ${year}`,
        description: budget === null 
          ? `No budget set. Spent $${spending.toFixed(2)}`
          : `Budget: $${budget.toFixed(2)}\nSpent: $${spending.toFixed(2)}\n${
              savings >= 0 
                ? `Saved: $${savings.toFixed(2)}` 
                : `Overspent: $${Math.abs(savings).toFixed(2)}`
            }`,
        duration: 5000,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Expense Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total {totalSavings >= 0 ? "Savings" : "Deficit"}</p>
              <p className={`text-2xl font-bold ${totalSavings >= 0 ? "text-green-500" : "text-red-500"}`}>
                ${Math.abs(totalSavings).toFixed(2)}
              </p>
            </div>
          </div>

          <BudgetProgress 
            currentMonthTotal={currentMonthTotal} 
            budgetGoal={budgetGoal}
          />

          <CategoryPieChart 
            expenses={currentMonthExpenses} 
            getCategoryById={getCategoryById} 
          />

          <CategoryLegend categories={expensesByCategory} />
          
          {expenses.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Monthly Spending History</h4>
              <MonthlySpendingChart 
                expenses={expenses} 
                getBudgetForMonth={getBudgetForMonth}
                onBarClick={handleBarClick}
              />
              <ChartLegend 
                items={[
                  { color: "#4B5563", label: "Monthly Savings", type: "bar" },
                  { color: "blue-600", label: "Monthly Spending", type: "line", height: 1 },
                  { color: "green-500", label: "Budget Goal", type: "dashed", height: 1 }
                ]}
              />
              
              <StatsGrid 
                stats={[
                  {
                    label: "Average Monthly Expense",
                    value: `$${averageMonthlyExpense.toFixed(2)}`
                  },
                  {
                    label: "Current Monthly Budget",
                    value: currentMonthlyBudget === null ? "Not set" : `$${currentMonthlyBudget.toFixed(2)}`
                  },
                  {
                    label: "Average Monthly Savings",
                    value: averageMonthlySavings === null 
                      ? "Budget not set" 
                      : `$${Math.abs(averageMonthlySavings).toFixed(2)}`,
                    colorClass: averageMonthlySavings !== null && averageMonthlySavings < 0 
                      ? "text-red-500" 
                      : averageMonthlySavings !== null 
                        ? "text-green-500" 
                        : "",
                    subtext: averageMonthlySavings !== null && averageMonthlySavings < 0 ? "(Deficit)" : ""
                  }
                ]}
              />
            </div>
          )}
          
          {expenses.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Top 3 Spending Categories</h4>
              <TopCategoriesChart 
                expenses={expenses} 
                getCategoryById={getCategoryById}
                limit={3}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

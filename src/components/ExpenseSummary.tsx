import { useState } from "react";
import { Expense, ExpenseCategory, BudgetGoal } from "@/types/expense";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CategoryPieChart } from "./charts/CategoryPieChart";
import { MonthlySpendingChart } from "./charts/MonthlySpendingChart";
import { MonthlySavingsChart } from "./charts/MonthlySavingsChart";
import { StatsGrid } from "./summary/StatsGrid";
import { BudgetProgress } from "./summary/BudgetProgress";
import { DailySpendingChart } from "./charts/DailySpendingChart";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle } from "lucide-react";

interface ExpenseSummaryProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  getCategoryById: (id: string) => ExpenseCategory;
  budgetGoal: BudgetGoal | null;
  currentMonthTotal: number;
  getBudgetForMonth: (month: number, year: number) => number | null;
  calculateAverageMonthlyExpense: () => number;
  totalSavings: number;
  distributeMonthlyBudgetSavings: () => boolean;
}

export function ExpenseSummary({
  expenses,
  categories,
  getCategoryById,
  budgetGoal,
  currentMonthTotal,
  getBudgetForMonth,
  calculateAverageMonthlyExpense,
  totalSavings,
  distributeMonthlyBudgetSavings,
}: ExpenseSummaryProps) {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

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

  const selectedMonthExpenses = useMemo(() => {
    return expenses.filter(expense =>
      isSameMonth(expense.date, selectedMonth) && 
      isSameYear(expense.date, selectedMonth)
    );
  }, [expenses, selectedMonth]);

  const expensesByCategory = useMemo(() => {
    const result: Record<string, number> = {};
    const total = selectedMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    selectedMonthExpenses.forEach((expense) => {
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
  }, [selectedMonthExpenses, getCategoryById]);

  const averageMonthlyExpense = calculateAverageMonthlyExpense();
  const currentMonthlyBudget = budgetGoal?.amount ?? 0;

  const averageMonthlySavings = useMemo(() => {
    if (currentMonthlyBudget === null) return null;
    return currentMonthlyBudget - averageMonthlyExpense;
  }, [currentMonthlyBudget, averageMonthlyExpense]);

  const dateRange = useMemo(() => {
    if (expenses.length === 0) {
      return { minDate: undefined, maxDate: new Date() };
    }
    
    let minDate = expenses[0].date;
    let maxDate = expenses[0].date;
    
    expenses.forEach(expense => {
      if (expense.date < minDate) minDate = expense.date;
      if (expense.date > maxDate) maxDate = expense.date;
    });
    
    return { minDate, maxDate: new Date() };
  }, [expenses]);

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

  const SPENDING_COLOR = "#2563eb";
  const BUDGET_COLOR = "#4ade80";
  const SAVINGS_COLOR = "#4B5563";

  return (
    <div className="space-y-6">
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

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Monthly Category Breakdown</h4>
              <MonthSelector 
                value={selectedMonth} 
                onChange={setSelectedMonth}
                minDate={dateRange.minDate}
                maxDate={dateRange.maxDate}
              />
              <CategoryPieChart 
                expenses={expenses} 
                getCategoryById={getCategoryById}
                selectedDate={selectedMonth}
              />
              <CategoryLegend categories={expensesByCategory} />
            </div>
          </div>
        </CardContent>
      </Card>

      {totalSavings > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Monthly Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                You've saved <span className="font-semibold">${totalSavings.toFixed(2)}</span> this month!
                Would you like to distribute these savings to your active goals?
              </p>
              <Button 
                onClick={distributeMonthlyBudgetSavings}
                className="w-full"
                variant="default"
              >
                Distribute Savings to Goals
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {expenses.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Monthly Spending History</h4>
          <MonthlySpendingChart 
            expenses={expenses} 
            getBudgetForMonth={getBudgetForMonth}
            chartColors={{
              spending: SPENDING_COLOR,
              budget: BUDGET_COLOR
            }}
          />
          <ChartLegend 
            items={[
              { color: SPENDING_COLOR, label: "Monthly Spending", type: "line", height: 1 },
              { color: BUDGET_COLOR, label: "Budget Goal", type: "dashed", height: 1 }
            ]}
          />
          
          <h4 className="text-sm font-medium mb-2 mt-4">Monthly Savings</h4>
          <MonthlySavingsChart 
            expenses={expenses} 
            getBudgetForMonth={getBudgetForMonth}
            savingsColor={SAVINGS_COLOR}
          />
          <ChartLegend 
            items={[
              { color: SAVINGS_COLOR, label: "Monthly Savings", type: "bar" }
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
          
          <div className="mt-6 pt-4 border-t border-border">
            <YearlyTopCategoriesChart 
              expenses={expenses} 
              getCategoryById={getCategoryById} 
              limit={3}
            />
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <DailySpendingChart expenses={expenses} />
          </div>
        </div>
      )}
    </div>
  );
}

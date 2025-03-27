
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryPieChart } from "./charts/CategoryPieChart";
import { MonthlySpendingChart } from "./charts/MonthlySpendingChart";
import { YearlyTopCategoriesChart } from "./charts/YearlyTopCategoriesChart";
import { MonthSelector } from "./charts/MonthSelector";
import { CategoryLegend } from "./charts/CategoryLegend";
import { ChartLegend } from "./charts/ChartLegend";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavingGoalSection } from "./SavingGoalSection";
import { Expense, ExpenseCategory, BudgetGoal, SavingGoal } from "@/types/expense";
import { AlertTriangle, Sparkles, TrendingUp } from "lucide-react";
import { SavingGoalProgress } from "./SavingGoalProgress";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { isSameMonth, isSameYear } from "date-fns";

type ExpenseSummaryProps = {
  expenses: Expense[];
  categories: ExpenseCategory[];
  getCategoryById: (id: string) => ExpenseCategory;
  budgetGoal: BudgetGoal;
  currentMonthTotal: number;
  getBudgetForMonth: (month: number, year: number) => number | null;
  calculateAverageMonthlyExpense: (expenses: Expense[]) => number;
  totalSavings: number;
  distributeMonthlyBudgetSavings: () => boolean;
  savingGoals?: SavingGoal[];
  onAddSavingGoal?: (goal: { amount: number; purpose: string }) => void;
  onToggleSavingGoal?: (id: string, achieved: boolean) => void;
  onDeleteSavingGoal?: (id: string) => void;
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
  distributeMonthlyBudgetSavings,
  savingGoals = [],
  onAddSavingGoal,
  onToggleSavingGoal,
  onDeleteSavingGoal,
}: ExpenseSummaryProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeChartTab, setActiveChartTab] = useState("monthly");
  const [activeSavingsTab, setActiveSavingsTab] = useState("overview");

  // Get all expenses for the selected month
  const selectedMonthExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = expense.date;
      return isSameMonth(expenseDate, selectedMonth) && 
             isSameYear(expenseDate, selectedMonth);
    });
  }, [expenses, selectedMonth]);

  // Calculate total amount for the selected month
  const selectedMonthTotal = useMemo(() => {
    return selectedMonthExpenses.reduce((total, expense) => total + expense.amount, 0);
  }, [selectedMonthExpenses]);

  // Calculate budget progress
  const budgetProgress = useMemo(() => {
    const month = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();
    const selectedMonthBudget = getBudgetForMonth(month, year);
    
    if (selectedMonthBudget === null || selectedMonthBudget === 0) return null;
    
    const percentage = (selectedMonthTotal / selectedMonthBudget) * 100;
    return {
      current: selectedMonthTotal,
      max: selectedMonthBudget,
      percentage: Math.min(percentage, 100),
      isOverBudget: percentage > 100
    };
  }, [selectedMonth, selectedMonthTotal, getBudgetForMonth]);

  // Filter active saving goals (not achieved)
  const activeSavingGoals = useMemo(() => {
    return savingGoals.filter(goal => !goal.achieved);
  }, [savingGoals]);

  const handleDistributeSavings = () => {
    const success = distributeMonthlyBudgetSavings();
    if (success) {
      toast({
        title: "Savings distributed",
        description: `$${totalSavings.toFixed(2)} has been distributed to your saving goals.`,
      });
    } else {
      toast({
        title: "No savings to distribute",
        description: "You don't have any savings for the current month to distribute.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Monthly Budget Overview</span>
            <MonthSelector
              value={selectedMonth}
              onChange={setSelectedMonth}
              minDate={new Date(new Date().getFullYear() - 1, 0)}
              maxDate={new Date(new Date().getFullYear() + 1, 11)}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Spending by Category</h4>
                <CategoryPieChart
                  expenses={expenses}
                  getCategoryById={getCategoryById}
                  selectedDate={selectedMonth}
                />
                <CategoryLegend
                  categories={selectedMonthExpenses
                    .reduce((acc, expense) => {
                      const category = getCategoryById(expense.categoryId);
                      const existingCategory = acc.find(c => c.name === category.name);
                      if (existingCategory) {
                        existingCategory.value += expense.amount;
                      } else {
                        acc.push({
                          name: category.name,
                          value: expense.amount,
                          color: category.color,
                          percentage: 0 // Will be calculated below
                        });
                      }
                      return acc;
                    }, [] as { name: string; value: number; color: string; percentage: number }[])
                    .map(category => {
                      return {
                        ...category,
                        percentage: (category.value / (selectedMonthTotal || 1)) * 100
                      };
                    })
                    .sort((a, b) => b.value - a.value)}
                />
              </div>
              
              <div className="space-y-4">
                <Tabs 
                  value={activeChartTab} 
                  onValueChange={setActiveChartTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="monthly">Monthly Trend</TabsTrigger>
                    <TabsTrigger value="topCategories">Top Categories</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="monthly" className="space-y-2">
                    <MonthlySpendingChart
                      expenses={expenses}
                      getBudgetForMonth={getBudgetForMonth}
                    />
                    <ChartLegend
                      items={[
                        { color: "#2563eb", label: "Monthly Spending", type: "line" },
                        { color: "#4ade80", label: "Budget Goal", type: "dashed" }
                      ]}
                    />
                  </TabsContent>
                  
                  <TabsContent value="topCategories" className="space-y-2">
                    <ChartLegend
                      items={[
                        { color: "#2563eb", label: "This Month", type: "bar" },
                        { color: "#4ade80", label: "Last Month", type: "bar" }
                      ]}
                    />
                    <div className="mt-4">
                      <YearlyTopCategoriesChart
                        expenses={expenses}
                        getCategoryById={getCategoryById}
                        limit={3}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Current Month</span>
                    <span className="text-2xl font-bold">${currentMonthTotal.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Monthly Budget</span>
                    <span className="text-2xl font-bold">
                      {budgetGoal.amount !== null ? `$${budgetGoal.amount.toFixed(2)}` : 'Not set'}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Average Monthly</span>
                    <span className="text-2xl font-bold">${calculateAverageMonthlyExpense(expenses).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Monthly Savings</span>
                    <span className="text-2xl font-bold text-green-600">${totalSavings.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 text-amber-500 mr-2" />
            <span>Savings Goals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSavingsTab} onValueChange={setActiveSavingsTab}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="overview">Savings Overview</TabsTrigger>
              <TabsTrigger value="goals">Manage Goals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              {totalSavings > 0 && (
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Current Savings: ${totalSavings.toFixed(2)}</h3>
                    <p className="text-sm text-muted-foreground">
                      Distribute your current savings to your active goals
                    </p>
                  </div>
                  <Button onClick={handleDistributeSavings}>
                    Distribute Savings
                  </Button>
                </div>
              )}
              
              {activeSavingGoals.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Active Saving Goals</h3>
                  <div className="space-y-4">
                    {activeSavingGoals.map(goal => (
                      <SavingGoalProgress key={goal.id} goal={goal} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border rounded-md">
                  <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium mb-1">No Active Saving Goals</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a saving goal to start tracking your progress
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveSavingsTab("goals")}
                  >
                    Create a Goal
                  </Button>
                </div>
              )}
              
              {budgetGoal.amount === null && (
                <div className="flex items-start space-x-2 p-3 border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950 rounded-md mt-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-300">No Budget Set</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Set a monthly budget to track your savings and contribute to your goals.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="goals">
              {onAddSavingGoal && onToggleSavingGoal && onDeleteSavingGoal && (
                <SavingGoalSection
                  goals={savingGoals}
                  onAddGoal={onAddSavingGoal}
                  onToggleGoal={onToggleSavingGoal}
                  onDeleteGoal={onDeleteSavingGoal}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

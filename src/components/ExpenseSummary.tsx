import { useMemo } from "react";
import { Expense, ExpenseCategory, BudgetGoal } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { Progress } from "@/components/ui/progress";

type ExpenseSummaryProps = {
  expenses: Expense[];
  categories: ExpenseCategory[];
  getCategoryById: (id: string) => ExpenseCategory;
  budgetGoal: BudgetGoal;
  currentMonthTotal: number;
  getBudgetForMonth: (month: number, year: number) => number | null;
};

export function ExpenseSummary({
  expenses,
  categories,
  getCategoryById,
  budgetGoal,
  currentMonthTotal,
  getBudgetForMonth,
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
    
    currentMonthExpenses.forEach((expense) => {
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
    }).sort((a, b) => b.value - a.value);
  }, [currentMonthExpenses, getCategoryById]);

  const top3Categories = useMemo(() => {
    const result: Record<string, number> = {};
    
    expenses.forEach((expense) => {
      const categoryId = expense.categoryId;
      result[categoryId] = (result[categoryId] || 0) + expense.amount;
    });
    
    return Object.entries(result)
      .map(([categoryId, amount]) => {
        const category = getCategoryById(categoryId);
        return {
          name: category.name,
          amount: parseFloat(amount.toFixed(2)),
          color: category.color
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [expenses, getCategoryById]);

  const budgetPercentage = useMemo(() => {
    if (budgetGoal.amount === null) return 0;
    return Math.min(Math.round((currentMonthTotal / budgetGoal.amount) * 100), 100);
  }, [currentMonthTotal, budgetGoal.amount]);
  
  const isOverBudget = useMemo(() => {
    if (budgetGoal.amount === null) return false;
    return currentMonthTotal > budgetGoal.amount;
  }, [currentMonthTotal, budgetGoal.amount]);

  const monthlySpending = useMemo(() => {
    const spendingByMonth: Record<string, number> = {};
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5); // Show last 6 months

    expenses.forEach((expense) => {
      if (expense.date >= sixMonthsAgo) {
        const monthKey = `${expense.date.getFullYear()}-${expense.date.getMonth() + 1}`;
        spendingByMonth[monthKey] = (spendingByMonth[monthKey] || 0) + expense.amount;
      }
    });

    const monthlyData = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleString('default', { month: 'short' });
      const monthBudget = getBudgetForMonth(date.getMonth(), date.getFullYear());
      
      monthlyData.unshift({
        month: monthName,
        spending: spendingByMonth[monthKey] || 0,
        budget: monthBudget
      });
    }

    return monthlyData;
  }, [expenses, getBudgetForMonth]);

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
                ${currentMonthTotal.toFixed(2)} 
                {budgetGoal.amount !== null && ` / $${budgetGoal.amount.toFixed(2)}`}
              </p>
            </div>
            {budgetGoal.amount !== null ? (
              <>
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
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No budget set for this month. Set a budget to track your spending.
              </p>
            )}
          </div>

          {currentMonthExpenses.length > 0 ? (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
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
                    {expensesByCategory.map((entry, index) => (
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
            {expensesByCategory.map((item, index) => (
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
          
          {monthlySpending.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Monthly Spending History</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlySpending}
                    margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value}`}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip 
                      formatter={(value: number | null) => value === null ? ["Not set", "Amount"] : [`$${value.toFixed(2)}`, "Amount"]}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="spending" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={{ fill: "#2563eb" }}
                      name="Monthly Spending"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="budget" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Budget Goal"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {top3Categories.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Top 3 Spending Categories</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={top3Categories}
                    margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value}`}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Bar 
                      dataKey="amount" 
                      radius={[4, 4, 0, 0]}
                    >
                      {top3Categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

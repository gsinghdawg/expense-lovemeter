import { useMemo } from "react";
import { Expense, ExpenseCategory, BudgetGoal } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ComposedChart } from "recharts";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";

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
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthKey = `${year}-${month + 1}`;
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      const monthBudget = getBudgetForMonth(month, year);
      const monthSpending = spendingByMonth[monthKey] || 0;
      
      monthlyData.unshift({
        month: monthName,
        spending: monthSpending,
        budget: monthBudget,
        savings: monthBudget !== null ? monthBudget - monthSpending : null,
        fullMonth: date.toLocaleString('default', { month: 'long' }),
        year: year
      });
    }

    return monthlyData;
  }, [expenses, getBudgetForMonth]);

  const averageMonthlyExpense = useMemo(() => {
    if (expenses.length === 0) return 0;
    
    const uniqueMonths = new Set();
    expenses.forEach(expense => {
      const monthKey = `${expense.date.getFullYear()}-${expense.date.getMonth() + 1}`;
      uniqueMonths.add(monthKey);
    });
    
    const trackedMonths = uniqueMonths.size;
    
    if (monthlySpending.length > 0 && trackedMonths > 0) {
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      return total / trackedMonths;
    }
    
    if (expenses.length > 0) {
      const sortedExpenses = [...expenses].sort((a, b) => 
        a.date.getTime() - b.date.getTime()
      );
      
      const firstExpenseDate = sortedExpenses[0].date;
      const currentDate = new Date();
      
      const monthDiff = 
        (currentDate.getFullYear() - firstExpenseDate.getFullYear()) * 12 + 
        (currentDate.getMonth() - firstExpenseDate.getMonth()) + 1;
      
      const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      return monthDiff > 0 ? totalSpent / monthDiff : totalSpent;
    }
    
    return 0;
  }, [expenses, monthlySpending]);

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
      // Show a toast with the savings information
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

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const customPieChartLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * (percent < 0.05 ? 1.2 : 0.6);
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.03) return null;

    const fontSize = percent > 0.15 ? 12 : percent > 0.08 ? 10 : 8;
    
    const showName = percent > 0.05;
    const showValue = percent > 0.08;
    const percentageDisplay = `${(percent * 100).toFixed(0)}%`;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 'bold',
          textShadow: '0px 0px 3px rgba(0,0,0,0.7)'
        }}
      >
        {showName && (
          <tspan x={x} dy="-0.8em">{name}</tspan>
        )}
        <tspan x={x} dy={showName ? "1.6em" : 0}>{percentageDisplay}</tspan>
        {showValue && (
          <tspan x={x} dy="1.2em">{formatCurrency(value)}</tspan>
        )}
      </text>
    );
  };

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
                    labelLine={false}
                    label={customPieChartLabel}
                    paddingAngle={3}
                    cornerRadius={3}
                    minAngle={2}
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
                  <ComposedChart
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
                      formatter={(value: number | null, name: string, props: any) => {
                        if (value === null) return ["Not set", name];
                        return [`$${value.toFixed(2)}`, name];
                      }}
                      labelFormatter={(label: string, items: any[]) => {
                        const item = items[0]?.payload;
                        return item ? `${item.fullMonth} ${item.year}` : label;
                      }}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Bar
                      dataKey="savings"
                      fill="#4B5563"
                      name="Monthly Savings"
                      barSize={20}
                      onClick={handleBarClick}
                      cursor="pointer"
                      isAnimationActive={true}
                      onMouseOver={(data) => {
                        if (data && data.tooltipPayload && data.tooltipPayload[0]) {
                          const value = data.tooltipPayload[0].value;
                          const color = value >= 0 ? "#4ade80" : "#ef4444";
                          data.element.style.fill = color;
                        }
                      }}
                      onMouseOut={(data) => {
                        if (data && data.element) {
                          data.element.style.fill = "#4B5563";
                        }
                      }}
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
                      stroke="#4ade80"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: "#4ade80", r: 4 }}
                      name="Budget Goal"
                      connectNulls={true}
                      activeDot={{ r: 6, fill: "#4ade80" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center space-x-6 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#4B5563] mr-1 cursor-pointer"></div>
                  <span>Monthly Savings</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-1 bg-blue-600 mr-1"></div>
                  <span>Monthly Spending</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-1 bg-green-500 mr-1 border-dashed border-t"></div>
                  <span>Budget Goal</span>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Average Monthly Expense</p>
                  <p className="text-sm font-medium">${averageMonthlyExpense.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Current Monthly Budget</p>
                  <p className="text-sm font-medium">
                    {currentMonthlyBudget === null 
                      ? "Not set" 
                      : `$${currentMonthlyBudget.toFixed(2)}`}
                  </p>
                </div>
                <div className={`bg-slate-50 dark:bg-slate-800 p-3 rounded-md ${
                  averageMonthlySavings !== null && averageMonthlySavings < 0 
                    ? "text-red-500" 
                    : averageMonthlySavings !== null 
                      ? "text-green-500" 
                      : ""
                }`}>
                  <p className="text-xs text-muted-foreground mb-1">Average Monthly Savings</p>
                  {averageMonthlySavings === null ? (
                    <p className="text-sm font-medium">Budget not set</p>
                  ) : (
                    <p className="text-sm font-medium">
                      ${Math.abs(averageMonthlySavings).toFixed(2)}
                      {averageMonthlySavings < 0 ? " (Deficit)" : ""}
                    </p>
                  )}
                </div>
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

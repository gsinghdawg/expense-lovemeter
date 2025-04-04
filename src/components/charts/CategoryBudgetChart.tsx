
import { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LabelList 
} from "recharts";
import { ExpenseCategory, CategoryBudget, Expense } from "@/types/expense";

type CategoryBudgetChartProps = {
  categoryBudgets: CategoryBudget[];
  categories: ExpenseCategory[];
  expenses: Expense[];
  month: number;
  year: number;
  getCategoryById: (id: string) => ExpenseCategory;
};

export function CategoryBudgetChart({
  categoryBudgets,
  categories,
  expenses,
  month,
  year,
  getCategoryById
}: CategoryBudgetChartProps) {
  const chartData = useMemo(() => {
    // Filter expenses for the selected month and year
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = expense.date;
      return expenseDate.getMonth() === month && 
             expenseDate.getFullYear() === year;
    });

    // Calculate spending by category
    const spendingByCategory: Record<string, number> = {};
    filteredExpenses.forEach(expense => {
      const categoryId = expense.categoryId;
      spendingByCategory[categoryId] = (spendingByCategory[categoryId] || 0) + expense.amount;
    });

    // Get categories with budgets for this month/year
    const budgetedCategories = categoryBudgets
      .filter(budget => budget.month === month && budget.year === year)
      .map(budget => budget.categoryId);
    
    // Get categories with expenses for this month/year
    const categoriesWithExpenses = filteredExpenses.map(expense => expense.categoryId);
    
    // Combine both sets to get all categories we need to display
    const categoryIdsToShow = new Set([
      ...budgetedCategories,
      ...categoriesWithExpenses
    ]);

    // Create data for the chart
    return Array.from(categoryIdsToShow).map(categoryId => {
      const category = getCategoryById(categoryId);
      const spent = spendingByCategory[categoryId] || 0;
      
      // Find budget for this category (if exists)
      const budget = categoryBudgets.find(
        b => b.categoryId === categoryId && b.month === month && b.year === year
      );
      const budgetAmount = budget ? budget.amount : 0;
      
      const remaining = Math.max(0, budgetAmount - spent);
      const overspent = spent > budgetAmount && budgetAmount > 0 ? spent - budgetAmount : 0;
      
      return {
        name: category?.name || "Unknown Category",
        budget: budgetAmount,
        spent: spent,
        remaining: remaining,
        overspent: overspent,
        percentUsed: budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0,
        color: category?.color || "#888888",
        categoryId: categoryId,
        hasBudget: budgetAmount > 0
      };
    })
    .sort((a, b) => {
      // First sort by budget status (budgeted categories first)
      if (a.hasBudget !== b.hasBudget) return a.hasBudget ? -1 : 1;
      
      // Then sort by budget amount for budgeted categories
      if (a.hasBudget && b.hasBudget && a.budget !== b.budget) return b.budget - a.budget;
      
      // Then sort by spending for unbudgeted categories
      return b.spent - a.spent;
    });
  }, [categoryBudgets, expenses, month, year, getCategoryById]);

  if (chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[200px] text-muted-foreground">
        No expenses or budgets for this month
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const spentPercentage = data.budget > 0 ? ((data.spent / data.budget) * 100).toFixed(1) : "N/A";
      const status = data.budget > 0 
        ? (data.spent <= data.budget ? "Within budget" : "Over budget") 
        : "No budget set";
      const statusColor = data.budget > 0 
        ? (data.spent <= data.budget ? "text-green-500" : "text-red-500")
        : "text-yellow-500";
      
      return (
        <div className="p-3 bg-background border border-border rounded-md shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Budget: ${data.budget > 0 ? data.budget.toFixed(2) : "Not set"}</p>
          <p className="text-sm">Spent: ${data.spent.toFixed(2)} {spentPercentage !== "N/A" && `(${spentPercentage}%)`}</p>
          <p className={`text-sm font-medium ${statusColor}`}>{status}</p>
          {data.remaining > 0 && (
            <p className="text-sm text-green-500">
              Remaining: ${data.remaining.toFixed(2)}
            </p>
          )}
          {data.overspent > 0 && (
            <p className="text-sm text-red-500">
              Overspent: ${data.overspent.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Calculate the maximum value for the x-axis to ensure proper spacing
  const maxValue = Math.max(
    ...chartData.map(item => Math.max(item.budget, item.spent)),
    100 // Set a minimum value to ensure the chart is visible even with small values
  );

  return (
    <div className="h-[400px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 50, left: 90, bottom: 10 }}
          barGap={5}
          barSize={16}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis 
            type="number" 
            domain={[0, maxValue * 1.1]} // Add 10% padding to the max value
            tickFormatter={(value) => `$${Math.round(value)}`} // Round to whole numbers
            ticks={Array.from({ length: 5 }, (_, i) => Math.round(maxValue * i / 4))} // Generate whole number ticks
            allowDecimals={false}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={90}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />
          <Bar 
            name="Budget" 
            dataKey="budget" 
            fill="transparent"
            stroke="#8B5CF6" // Vivid Purple - more visible
            strokeWidth={2}
            strokeDasharray="5 5"
            radius={[0, 4, 4, 0]}
          />
          <Bar 
            name="Spent" 
            dataKey="spent" 
            radius={[0, 4, 4, 0]}
            legendType="none" // Remove the legend indicator box
          >
            <LabelList 
              dataKey="spent" 
              position="right" 
              formatter={(value: number) => `$${Math.round(value)}`}
              style={{ fontSize: '11px', fill: '#444', fontWeight: 'bold' }}
            />
            {/* Use category colors for each bar */}
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

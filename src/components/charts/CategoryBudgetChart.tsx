
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

    // Create data for the chart
    return categoryBudgets
      .filter(budget => budget.amount > 0) // Only show categories with allocated budget
      .map(budget => {
        const category = getCategoryById(budget.categoryId);
        const spent = spendingByCategory[budget.categoryId] || 0;
        const remaining = Math.max(0, budget.amount - spent);
        const overspent = spent > budget.amount ? spent - budget.amount : 0;
        
        return {
          name: category.name,
          budget: budget.amount,
          spent: spent,
          remaining: remaining,
          overspent: overspent,
          percentUsed: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
          color: category.color,
          categoryId: budget.categoryId
        };
      })
      .sort((a, b) => b.budget - a.budget); // Sort by budget amount descending
  }, [categoryBudgets, expenses, month, year, getCategoryById]);

  if (chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[200px] text-muted-foreground">
        No category budgets set for this month
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const spentPercentage = ((data.spent / data.budget) * 100).toFixed(1);
      const status = data.spent <= data.budget ? "Within budget" : "Over budget";
      const statusColor = data.spent <= data.budget ? "text-green-500" : "text-red-500";
      
      return (
        <div className="p-3 bg-background border border-border rounded-md shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Budget: ${data.budget.toFixed(2)}</p>
          <p className="text-sm">Spent: ${data.spent.toFixed(2)} ({spentPercentage}%)</p>
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
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
          barGap={5}
          barSize={16}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis 
            type="number" 
            domain={[0, maxValue * 1.1]} // Add 10% padding to the max value
            tickFormatter={(value) => `$${value}`}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={80}
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
            fill="#F97316" // Bright Orange - more visible
            radius={[0, 4, 4, 0]}
          >
            <LabelList 
              dataKey="spent" 
              position="right" 
              formatter={(value: number) => `$${value.toFixed(0)}`}
              style={{ fontSize: '10px', fill: '#888' }}
            />
            {chartData.map((entry, index) => {
              // Change color based on whether over budget or not
              const barColor = entry.spent > entry.budget ? '#ea384c' : '#0EA5E9';
              return <Cell key={`cell-${index}`} fill={barColor} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

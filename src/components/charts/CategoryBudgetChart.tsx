
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
  ResponsiveContainer 
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
      
      return (
        <div className="p-3 bg-background border border-border rounded-md shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Budget: ${data.budget.toFixed(2)}</p>
          <p className="text-sm">Spent: ${data.spent.toFixed(2)} ({spentPercentage}%)</p>
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

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis 
            type="number" 
            tickFormatter={(value) => `$${value}`}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={80}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="budget" 
            name="Budget" 
            stackId="a" 
            fill="transparent"
            stroke="#cccccc"
            strokeWidth={1}
            strokeDasharray="5 5"
          />
          <Bar 
            dataKey="spent" 
            name="Spent" 
            stackId="b" 
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

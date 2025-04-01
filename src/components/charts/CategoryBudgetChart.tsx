
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Legend } from "recharts";
import { CategoryBudget, ExpenseCategory } from "@/types/expense";

type CategoryBudgetChartProps = {
  categoryBudgets: CategoryBudget[];
  categories: ExpenseCategory[];
  currentMonthExpensesByCategory: Record<string, number>;
};

export function CategoryBudgetChart({ 
  categoryBudgets,
  categories,
  currentMonthExpensesByCategory
}: CategoryBudgetChartProps) {
  const chartData = useMemo(() => {
    return categoryBudgets.map(budget => {
      const category = categories.find(c => c.id === budget.categoryId);
      const spent = currentMonthExpensesByCategory[budget.categoryId] || 0;
      
      return {
        name: category?.name || "Unknown",
        budget: budget.amount,
        spent: spent,
        color: category?.color || "#999999",
        remaining: Math.max(budget.amount - spent, 0)
      };
    });
  }, [categoryBudgets, categories, currentMonthExpensesByCategory]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          barGap={0}
          barCategoryGap={10}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 10 }}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tickFormatter={(value) => `$${value}`}
            tick={{ fontSize: 10 }}
            tickLine={false}
            width={50}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              return [`$${value.toFixed(2)}`, name === "budget" ? "Budget" : name === "spent" ? "Spent" : "Remaining"];
            }}
            labelFormatter={(label) => `${label}`}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            formatter={(value) => {
              return value === "budget" ? "Budget" : value === "spent" ? "Spent" : "Remaining";
            }}
          />
          <Bar 
            dataKey="budget" 
            fill="#94a3b8" 
            name="budget"
            radius={[4, 4, 0, 0]}
            fillOpacity={0.7}
          >
            {chartData.map((entry, index) => (
              <Cell key={`budget-${index}`} fill="#94a3b8" />
            ))}
          </Bar>
          <Bar 
            dataKey="spent" 
            name="spent"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`spent-${index}`} 
                fill={entry.spent > entry.budget ? "#ef4444" : entry.color} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

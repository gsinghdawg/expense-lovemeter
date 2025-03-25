
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Expense, ExpenseCategory } from "@/types/expense";

type TopCategoriesChartProps = {
  expenses: Expense[];
  getCategoryById: (id: string) => ExpenseCategory;
  limit?: number;
};

export function TopCategoriesChart({ expenses, getCategoryById, limit = 3 }: TopCategoriesChartProps) {
  const topCategories = useMemo(() => {
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
      .slice(0, limit);
  }, [expenses, getCategoryById, limit]);

  if (expenses.length === 0 || topCategories.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        No expense data available for this period
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={topCategories}
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
            {topCategories.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

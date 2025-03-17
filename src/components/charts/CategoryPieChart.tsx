
import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Expense, ExpenseCategory } from "@/types/expense";

type CategoryPieChartProps = {
  expenses: Expense[];
  getCategoryById: (id: string) => ExpenseCategory;
};

export function CategoryPieChart({ expenses, getCategoryById }: CategoryPieChartProps) {
  const expensesByCategory = useMemo(() => {
    const result: Record<string, number> = {};
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    expenses.forEach((expense) => {
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
  }, [expenses, getCategoryById]);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Add expenses to see your spending breakdown
      </div>
    );
  }

  return (
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
            label={false}
            labelLine={false}
          >
            {expensesByCategory.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: any) => {
              const item = props.payload;
              return [`$${value.toFixed(2)} (${item.percentage.toFixed(1)}%)`, name];
            }}
            contentStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

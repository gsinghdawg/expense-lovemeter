
import { useMemo } from "react";
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Expense } from "@/types/expense";

type MonthlySpendingChartProps = {
  expenses: Expense[];
  getBudgetForMonth: (month: number, year: number) => number | null;
  onBarClick: (data: any) => void;
};

export function MonthlySpendingChart({ 
  expenses, 
  getBudgetForMonth, 
  onBarClick 
}: MonthlySpendingChartProps) {
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

  if (monthlySpending.length === 0) {
    return null;
  }

  return (
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
            onClick={onBarClick}
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
  );
}

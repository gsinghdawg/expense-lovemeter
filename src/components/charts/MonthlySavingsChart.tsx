
import { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Expense } from "@/types/expense";

type MonthlySavingsChartProps = {
  expenses: Expense[];
  getBudgetForMonth: (month: number, year: number) => number | null;
  onBarClick?: (data: any) => void;
  savingsColor?: string;
};

export function MonthlySavingsChart({ 
  expenses, 
  getBudgetForMonth, 
  onBarClick,
  savingsColor = "#4B5563" 
}: MonthlySavingsChartProps) {
  const monthlySavings = useMemo(() => {
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
        savings: monthBudget !== null ? monthBudget - monthSpending : null,
        fullMonth: date.toLocaleString('default', { month: 'long' }),
        year: year,
        budget: monthBudget,
        spending: monthSpending
      });
    }

    return monthlyData;
  }, [expenses, getBudgetForMonth]);

  if (monthlySavings.length === 0) {
    return null;
  }

  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={monthlySavings}
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
              if (value === null) return ["No budget set", name];
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
            fill={savingsColor}
            name="Monthly Savings"
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
                data.element.style.fill = savingsColor;
              }
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

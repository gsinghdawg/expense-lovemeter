
import { useMemo } from "react";
import { 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Expense } from "@/types/expense";

type ChartColors = {
  spending: string;
  budget: string;
};

type MonthlySpendingChartProps = {
  expenses: Expense[];
  getBudgetForMonth: (month: number, year: number) => number | null;
  onBarClick?: (data: any) => void;
  chartColors?: ChartColors;
};

export function MonthlySpendingChart({ 
  expenses, 
  getBudgetForMonth, 
  onBarClick,
  chartColors = {
    spending: "#2563eb",
    budget: "#4ade80"
  }
}: MonthlySpendingChartProps) {
  const monthlySpending = useMemo(() => {
    const spendingByMonth: Record<string, number> = {};
    const currentYear = new Date().getFullYear();
    
    // Filter expenses for the current year
    const currentYearExpenses = expenses.filter(expense => 
      expense.date.getFullYear() === currentYear
    );
    
    // Organize expenses by month
    currentYearExpenses.forEach((expense) => {
      const month = expense.date.getMonth();
      const monthKey = `${month}`;
      spendingByMonth[monthKey] = (spendingByMonth[monthKey] || 0) + expense.amount;
    });

    // Create data for all 12 months of the current year
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const monthlyData = [];
    for (let month = 0; month < 12; month++) {
      const monthBudget = getBudgetForMonth(month, currentYear);
      const monthSpending = spendingByMonth[`${month}`] || 0;
      
      monthlyData.push({
        month: monthNames[month],
        monthIndex: month,
        spending: monthSpending,
        budget: monthBudget,
        savings: monthBudget !== null ? monthBudget - monthSpending : null,
        fullMonth: new Date(currentYear, month).toLocaleString('default', { month: 'long' }),
        year: currentYear
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
          <Line 
            type="monotone" 
            dataKey="spending" 
            stroke={chartColors.spending} 
            strokeWidth={2}
            dot={{ fill: chartColors.spending }}
            name="Monthly Spending"
          />
          <Line 
            type="monotone" 
            dataKey="budget" 
            stroke={chartColors.budget}
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ fill: chartColors.budget, r: 4 }}
            name="Budget Goal"
            connectNulls={true}
            activeDot={{ r: 6, fill: chartColors.budget }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

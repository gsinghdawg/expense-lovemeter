
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
import { toast } from "@/hooks/use-toast";
import { endOfMonth, isAfter } from "date-fns";

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
    const currentYear = new Date().getFullYear();
    const now = new Date();
    
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
      
      // Only calculate savings if the budget is explicitly set
      const savings = monthBudget !== null ? monthBudget - monthSpending : null;
      
      // Check if this month has ended
      const monthDate = new Date(currentYear, month, 1);
      const monthEndDate = endOfMonth(monthDate);
      const isMonthCompleted = isAfter(now, monthEndDate);
      
      monthlyData.push({
        month: monthNames[month],
        monthIndex: month,
        savings: savings,
        spending: monthSpending,
        budget: monthBudget,
        fullMonth: new Date(currentYear, month).toLocaleString('default', { month: 'long' }),
        year: currentYear,
        isMonthCompleted: isMonthCompleted
      });
    }

    return monthlyData;
  }, [expenses, getBudgetForMonth]);

  const handleBarClick = (data: any) => {
    if (data && data.payload) {
      const { fullMonth, year, budget, spending, savings, isMonthCompleted } = data.payload;
      
      // Include month completion status in the message
      const completionStatus = isMonthCompleted 
        ? "Month completed" 
        : "Month in progress";
      
      const message = budget === null 
        ? `${fullMonth} ${year}: No budget set. Spent $${spending.toFixed(2)}. ${completionStatus}`
        : `${fullMonth} ${year}: Budget $${budget.toFixed(2)}, Spent $${spending.toFixed(2)}, ${
            savings >= 0 
              ? `Saved $${savings.toFixed(2)}` 
              : `Overspent $${Math.abs(savings).toFixed(2)}`
          }. ${completionStatus}`;
          
      console.log(message);
      toast({
        title: `${fullMonth} ${year} - ${isMonthCompleted ? "Completed" : "In Progress"}`,
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
    
    if (onBarClick) {
      onBarClick(data);
    }
  };

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
              if (!item) return label;
              return item.isMonthCompleted 
                ? `${item.fullMonth} ${item.year} - Completed`
                : `${item.fullMonth} ${item.year} - In Progress`;
            }}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar
            dataKey="savings"
            fill={savingsColor}
            name="Monthly Savings"
            onClick={handleBarClick}
            cursor="pointer"
            isAnimationActive={true}
            onMouseOver={(data) => {
              if (data && data.payload) {
                const value = data.payload.savings;
                if (value !== null) {
                  const color = value >= 0 ? "#4ade80" : "#ef4444";
                  if (data.element) {
                    data.element.style.fill = color;
                  }
                }
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

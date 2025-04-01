
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
import { endOfMonth, isAfter, subMonths, startOfMonth, isWithinInterval } from "date-fns";

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
      
      // Check if month has ended
      const monthDate = new Date(currentYear, month, 1);
      const monthEndDate = endOfMonth(monthDate);
      const isMonthEnded = isAfter(now, monthEndDate);
      
      // Check if it's the first day of the current month 
      // (allow distribution of previous month's savings)
      const today = now.getDate();
      const currentMonth = now.getMonth();
      const isFirstDayOfCurrentMonth = today === 1;
      
      // If it's the first day of the current month, enable distribution for the previous month
      const isPreviousMonth = month === ((currentMonth - 1 + 12) % 12);
      const canDistributePreviousMonth = isFirstDayOfCurrentMonth && isPreviousMonth;
      
      // For consistent year handling when dealing with December of previous year
      const isPreviousYearDecember = currentMonth === 0 && month === 11 && currentYear > monthDate.getFullYear();
      
      monthlyData.push({
        month: monthNames[month],
        monthIndex: month,
        savings: savings,
        spending: monthSpending,
        budget: monthBudget,
        fullMonth: new Date(currentYear, month).toLocaleString('default', { month: 'long' }),
        year: currentYear,
        isMonthEnded,
        canDistribute: isMonthEnded || canDistributePreviousMonth || isPreviousYearDecember
      });
    }

    return monthlyData;
  }, [expenses, getBudgetForMonth]);

  const handleBarClick = (data: any) => {
    if (data && data.payload) {
      const { fullMonth, year, budget, spending, savings, isMonthEnded, canDistribute } = data.payload;
      
      let statusMessage = "";
      if (isMonthEnded) {
        statusMessage = " (Month completed)";
      } else {
        statusMessage = " (Month in progress)";
      }
      
      const distributionStatus = canDistribute 
        ? " - Savings can be distributed" 
        : " - Wait until the month ends to distribute savings";
        
      const message = budget === null 
        ? `${fullMonth} ${year}${statusMessage}: No budget set. Spent $${spending.toFixed(2)}${distributionStatus}`
        : `${fullMonth} ${year}${statusMessage}: Budget $${budget.toFixed(2)}, Spent $${spending.toFixed(2)}, ${
            savings >= 0 
              ? `Saved $${savings.toFixed(2)}` 
              : `Overspent $${Math.abs(savings).toFixed(2)}`
          }${distributionStatus}`;
          
      console.log(message);
      toast({
        title: `${fullMonth} ${year}${statusMessage}`,
        description: budget === null 
          ? `No budget set. Spent $${spending.toFixed(2)}${distributionStatus}`
          : `Budget: $${budget.toFixed(2)}\nSpent: $${spending.toFixed(2)}\n${
              savings >= 0 
                ? `Saved: $${savings.toFixed(2)}` 
                : `Overspent: $${Math.abs(savings).toFixed(2)}`
            }${distributionStatus}`,
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
              
              const status = item.isMonthEnded 
                ? "Month completed" 
                : "Month in progress";
                
              const distributionStatus = item.canDistribute 
                ? "Savings can be distributed" 
                : "Wait until month ends to distribute savings";
                
              return `${item.fullMonth} ${item.year} (${status}, ${distributionStatus})`;
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
                  // Use different colors based on savings value and whether distribution is possible
                  let color = "#4B5563"; // Default gray
                  
                  if (data.payload.canDistribute) {
                    color = value >= 0 ? "#4ade80" : "#ef4444";
                  } else {
                    color = value >= 0 ? "#86efac" : "#fca5a5"; // Lighter colors for non-distributable months
                  }
                  
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


import { useState, useMemo } from "react";
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Expense } from "@/types/expense";
import { format, getDaysInMonth } from "date-fns";
import { ChartLegend } from "./ChartLegend";
import { MonthSelector } from "./MonthSelector";

type DailySpendingChartProps = {
  expenses: Expense[];
};

export function DailySpendingChart({ expenses }: DailySpendingChartProps) {
  // Default to current month/year
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Calculate data for the chart based on the selected month
  const chartData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    // Filter expenses for the selected month
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = expense.date;
      return (
        expenseDate.getFullYear() === year && 
        expenseDate.getMonth() === month
      );
    });
    
    // Group expenses by day
    const dailyExpenses: Record<number, number> = {};
    
    filteredExpenses.forEach(expense => {
      const day = expense.date.getDate();
      dailyExpenses[day] = (dailyExpenses[day] || 0) + expense.amount;
    });
    
    // Create data array for the chart
    return Object.entries(dailyExpenses).map(([day, amount]) => ({
      day: parseInt(day, 10),
      amount
    }));
  }, [expenses, selectedDate]);
  
  // Calculate the date range for the month selector
  const dateRange = useMemo(() => {
    if (expenses.length === 0) {
      return { minDate: undefined, maxDate: new Date() };
    }
    
    let minDate = expenses[0].date;
    let maxDate = expenses[0].date;
    
    expenses.forEach(expense => {
      if (expense.date < minDate) minDate = expense.date;
      if (expense.date > maxDate) maxDate = expense.date;
    });
    
    return { minDate, maxDate: new Date() };
  }, [expenses]);
  
  // Get days in month for X-axis domain
  const daysInMonth = getDaysInMonth(selectedDate);
  
  // Format tooltip
  const formatTooltip = (value: any, name: string) => {
    if (name === "amount") {
      return [`$${value.toFixed(2)}`, "Spending"];
    }
    return [value, name];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Daily Spending</h4>
        <MonthSelector 
          value={selectedDate} 
          onChange={setSelectedDate}
          minDate={dateRange.minDate}
          maxDate={dateRange.maxDate}
        />
      </div>
      
      <div className="h-[350px] w-full"> {/* Increased height to accommodate labels */}
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, left: 15, bottom: 30 }} // Increased margins to give space for labels
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="day" 
                name="Day" 
                domain={[0, daysInMonth + 1]}
                tickCount={Math.min(daysInMonth, 15)}
                label={{ 
                  value: 'Day of Month', 
                  position: 'insideBottom', 
                  offset: -5,
                  style: { textAnchor: 'middle' }
                }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis 
                type="number"
                dataKey="amount" 
                name="Amount" 
                unit="$"
                label={{ 
                  value: 'Amount ($)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' },
                  offset: 0
                }}
                tickFormatter={(value) => `${value}$`}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelFormatter={(value) => `Day ${value}`}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter 
                name="Daily Spending" 
                data={chartData} 
                fill="#8884d8" 
                shape="circle"
                line={{ stroke: '#8884d8', strokeWidth: 1, strokeDasharray: '5 5' }}
                lineType="joint"
              />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No expenses for {format(selectedDate, "MMMM yyyy")}
          </div>
        )}
      </div>
      
      <ChartLegend 
        items={[
          { color: "#8884d8", label: "Daily Spending", type: "scatter" }
        ]}
      />
    </div>
  );
}

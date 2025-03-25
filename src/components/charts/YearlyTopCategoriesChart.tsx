
import { useState, useMemo, useEffect } from "react";
import { Expense, ExpenseCategory } from "@/types/expense";
import { TopCategoriesChart } from "./TopCategoriesChart";
import { YearSelector } from "./YearSelector";

type YearlyTopCategoriesChartProps = {
  expenses: Expense[];
  getCategoryById: (id: string) => ExpenseCategory;
  limit?: number;
};

export function YearlyTopCategoriesChart({ 
  expenses, 
  getCategoryById, 
  limit = 3 
}: YearlyTopCategoriesChartProps) {
  // Default to current year
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Get the min and max years from expenses
  const yearRange = useMemo(() => {
    if (expenses.length === 0) {
      const currentYear = new Date().getFullYear();
      return { minYear: currentYear, maxYear: currentYear };
    }
    
    let minYear = expenses[0].date.getFullYear();
    let maxYear = expenses[0].date.getFullYear();
    
    expenses.forEach(expense => {
      const year = expense.date.getFullYear();
      if (year < minYear) minYear = year;
      if (year > maxYear) maxYear = year;
    });
    
    return { minYear, maxYear };
  }, [expenses]);
  
  // Filter expenses for the selected year
  const yearlyExpenses = useMemo(() => {
    return expenses.filter(expense => 
      expense.date.getFullYear() === selectedYear
    );
  }, [expenses, selectedYear]);

  // Handle year change
  const handleYearChange = (year: number) => {
    console.log("Year changed to:", year);
    setSelectedYear(year);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Top Categories ({selectedYear})</h4>
        <YearSelector 
          value={selectedYear} 
          onChange={handleYearChange} 
          minYear={yearRange.minYear} 
          maxYear={yearRange.maxYear}
        />
      </div>
      
      <TopCategoriesChart 
        expenses={yearlyExpenses} 
        getCategoryById={getCategoryById} 
        limit={limit}
      />
      
      {yearlyExpenses.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No expenses recorded for {selectedYear}
        </div>
      )}
    </div>
  );
}

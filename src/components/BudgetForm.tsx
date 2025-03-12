
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BudgetGoal } from "@/types/expense";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

interface BudgetFormProps {
  currentBudget: BudgetGoal;
  onUpdateBudget: (budget: BudgetGoal) => void;
}

export function BudgetForm({ currentBudget, onUpdateBudget }: BudgetFormProps) {
  const [amount, setAmount] = useState<number | null>(currentBudget.amount);
  const [month, setMonth] = useState<number>(currentBudget.month);
  const [year, setYear] = useState<number>(currentBudget.year);
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount === null || isNaN(Number(amount))) {
      return;
    }
    
    onUpdateBudget({
      amount,
      month,
      year
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value === '' ? null : parseFloat(value));
  };

  const handleMonthChange = (value: string) => {
    setMonth(parseInt(value));
  };

  const handleYearChange = (value: string) => {
    setYear(parseInt(value));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Budget Goal</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="budget-month">
                  Month
                </label>
                <Select value={month.toString()} onValueChange={handleMonthChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((monthName, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {monthName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="budget-year">
                  Year
                </label>
                <Select value={year.toString()} onValueChange={handleYearChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((yearValue) => (
                      <SelectItem key={yearValue} value={yearValue.toString()}>
                        {yearValue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="budget-amount">
                Budget Amount
              </label>
              <Input
                id="budget-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount === null ? '' : amount}
                onChange={handleInputChange}
                placeholder="Enter monthly budget"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={amount === null}>
            {currentBudget.amount === null ? "Set Budget" : "Update Budget"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

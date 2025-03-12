
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

interface BudgetFormProps {
  currentBudget: BudgetGoal;
  onUpdateBudget: (budget: BudgetGoal) => void;
}

export function BudgetForm({ currentBudget, onUpdateBudget }: BudgetFormProps) {
  const [amount, setAmount] = useState<number | null>(currentBudget.amount);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount === null || isNaN(Number(amount))) {
      return;
    }
    
    const now = new Date();
    onUpdateBudget({
      amount,
      month: now.getMonth(),
      year: now.getFullYear()
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value === '' ? null : parseFloat(value));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Budget Goal</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="budget-amount">
              Budget Amount ($)
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

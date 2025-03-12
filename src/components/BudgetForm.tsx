
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
  const [amount, setAmount] = useState(currentBudget.amount);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date();
    onUpdateBudget({
      amount,
      month: now.getMonth(),
      year: now.getFullYear()
    });
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
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">Update Budget</Button>
        </CardFooter>
      </form>
    </Card>
  );
}


import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { BudgetGoal } from "@/types/expense";

type BudgetProgressProps = {
  currentMonthTotal: number;
  budgetGoal: BudgetGoal;
};

export function BudgetProgress({ currentMonthTotal, budgetGoal }: BudgetProgressProps) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const budgetPercentage = useMemo(() => {
    if (budgetGoal.amount === null) return 0;
    return Math.min(Math.round((currentMonthTotal / budgetGoal.amount) * 100), 100);
  }, [currentMonthTotal, budgetGoal.amount]);
  
  const isOverBudget = useMemo(() => {
    if (budgetGoal.amount === null) return false;
    return currentMonthTotal > budgetGoal.amount;
  }, [currentMonthTotal, budgetGoal.amount]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <p className="text-sm font-medium">
          Budget for {months[budgetGoal.month]} {budgetGoal.year}
        </p>
        <p className="text-sm font-medium">
          ${currentMonthTotal.toFixed(2)} 
          {budgetGoal.amount !== null && ` / $${budgetGoal.amount.toFixed(2)}`}
        </p>
      </div>
      {budgetGoal.amount !== null ? (
        <>
          <Progress 
            value={budgetPercentage} 
            className={isOverBudget ? "bg-red-200" : ""}
            indicatorClassName={isOverBudget ? "bg-red-500" : ""}
          />
          {isOverBudget && (
            <p className="text-sm text-red-500 font-medium">
              You've exceeded your monthly budget by ${(currentMonthTotal - budgetGoal.amount).toFixed(2)}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No budget set for this month. Set a budget to track your spending.
        </p>
      )}
    </div>
  );
}

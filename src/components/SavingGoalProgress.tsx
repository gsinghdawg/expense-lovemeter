
import { SavingGoal } from "@/types/expense";
import { Progress } from "@/components/ui/progress";

interface SavingGoalProgressProps {
  goal: SavingGoal;
}

export function SavingGoalProgress({ goal }: SavingGoalProgressProps) {
  // Handle null/undefined progress values
  const progress = typeof goal.progress === 'number' ? goal.progress : 0;
  
  // Calculate percentage of progress
  const progressPercentage = goal.amount > 0 
    ? Math.min(Math.round((progress / goal.amount) * 100), 100) 
    : 0;
  
  return (
    <div className="w-full space-y-1">
      <Progress 
        value={progressPercentage} 
        className="h-2"
        indicatorClassName={progressPercentage === 100 ? "bg-green-500" : undefined}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>${progress.toFixed(2)} saved</span>
        <span>{progressPercentage}%</span>
      </div>
    </div>
  );
}

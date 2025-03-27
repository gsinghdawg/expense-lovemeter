
import { SavingGoal } from "@/types/expense";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface SavingGoalProgressProps {
  goal: SavingGoal;
}

export function SavingGoalProgress({ goal }: SavingGoalProgressProps) {
  // Calculate progress percentage, ensuring it doesn't exceed 100%
  const progressPercent = Math.min(((goal.progress || 0) / goal.amount) * 100, 100);
  const formattedDate = format(
    goal.created instanceof Date ? goal.created : new Date(goal.created),
    'MMM d, yyyy'
  );

  return (
    <div className="border rounded-md p-4 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{goal.purpose}</h4>
          <p className="text-sm text-muted-foreground">Created on {formattedDate}</p>
        </div>
        <div className="text-right">
          <div className="font-medium">{formatCurrency(goal.progress || 0)} / {formatCurrency(goal.amount)}</div>
          <div className="text-xs text-muted-foreground">{progressPercent.toFixed(0)}% complete</div>
        </div>
      </div>
      
      <Progress value={progressPercent} className="h-2" />
      
      <div className="pt-1 text-xs text-muted-foreground">
        {formatCurrency(goal.amount - (goal.progress || 0))} left to reach goal
      </div>
    </div>
  );
}

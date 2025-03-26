
import { useState } from "react";
import { SavingGoal } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, Trash2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SavingGoalListProps {
  goals: SavingGoal[];
  onToggleGoal: (id: string, achieved: boolean) => void;
  onDeleteGoal: (id: string) => void;
}

export function SavingGoalList({
  goals,
  onToggleGoal,
  onDeleteGoal
}: SavingGoalListProps) {
  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Your Saving Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            No saving goals yet. Add one above to get started!
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group goals by status (achieved or not)
  const activeGoals = goals.filter(goal => !goal.achieved);
  const achievedGoals = goals.filter(goal => goal.achieved);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Your Saving Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeGoals.length > 0 && (
          <>
            <h4 className="text-sm font-medium mb-2">Active Goals</h4>
            <div className="space-y-2">
              {activeGoals.map(goal => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  onToggle={onToggleGoal}
                  onDelete={onDeleteGoal}
                />
              ))}
            </div>
          </>
        )}
        
        {achievedGoals.length > 0 && (
          <>
            <h4 className="text-sm font-medium mb-2 mt-4">Achieved Goals</h4>
            <div className="space-y-2">
              {achievedGoals.map(goal => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  onToggle={onToggleGoal}
                  onDelete={onDeleteGoal}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface GoalItemProps {
  goal: SavingGoal;
  onToggle: (id: string, achieved: boolean) => void;
  onDelete: (id: string) => void;
}

function GoalItem({ goal, onToggle, onDelete }: GoalItemProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-md border",
        goal.achieved ? "bg-muted/50" : "bg-background"
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggle(goal.id, !goal.achieved)}
          className="h-8 w-8"
        >
          {goal.achieved ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </Button>
        <div className={cn(goal.achieved && "text-muted-foreground line-through")}>
          <div className="font-medium">{goal.purpose}</div>
          <div className="text-sm text-muted-foreground">
            ${goal.amount.toFixed(2)} · Added {format(goal.created, "MMM d, yyyy")}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(goal.id)}
        className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

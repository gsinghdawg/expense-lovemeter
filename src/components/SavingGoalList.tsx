
import { useState } from "react";
import { SavingGoal } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, Trash2, Wallet, Calendar, InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, eachMonthOfInterval, isSameMonth, subMonths } from "date-fns";
import { SavingGoalProgress } from "@/components/SavingGoalProgress";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SavingGoalListProps {
  goals: SavingGoal[];
  onToggleGoal: (id: string, achieved: boolean) => void;
  onDeleteGoal: (id: string) => void;
  onDistributeSavings?: (availableSavings: number, goalId: string) => void;
  monthEndSavings?: number;
  recoveredSavings?: number;
}

export function SavingGoalList({
  goals,
  onToggleGoal,
  onDeleteGoal,
  onDistributeSavings,
  monthEndSavings = 0,
  recoveredSavings = 0
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

  // Calculate total available savings by combining month-end and recovered savings
  const totalAvailableSavings = monthEndSavings + recoveredSavings;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Your Saving Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalAvailableSavings > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-xs text-muted-foreground mb-1">
                  <InfoIcon className="h-3 w-3 mr-1" />
                  <span>Distribute savings only at the end of the month or after it has passed</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm max-w-xs">
                  For accurate budgeting, only distribute savings after the month 
                  has ended and all expenses are accounted for.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
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
                  onDistributeSavings={onDistributeSavings}
                  availableSavings={totalAvailableSavings}
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
  onDistributeSavings?: (availableSavings: number, goalId: string) => void;
  availableSavings?: number;
}

function GoalItem({ goal, onToggle, onDelete, onDistributeSavings, availableSavings = 0 }: GoalItemProps) {
  const [showMonthsPopover, setShowMonthsPopover] = useState(false);
  
  // Generate list of months since goal creation until today
  const now = new Date();
  const past6Months = subMonths(now, 6); // Show at most 6 months back
  const startDate = goal.created > past6Months ? goal.created : past6Months;
  
  const monthsSinceCreation = eachMonthOfInterval({
    start: startDate,
    end: now
  });
  
  // For mock savings data per month (in a real app, this would be actual data)
  const mockMonthlySavings = new Map<string, number>();
  
  // Generate mock savings for demonstration
  monthsSinceCreation.forEach((month, index) => {
    // Generate random savings between $5 and $30 for each month except current
    if (!isSameMonth(month, now)) {
      const randomSaving = Math.floor(Math.random() * 26) + 5;
      mockMonthlySavings.set(format(month, 'yyyy-MM'), randomSaving);
    }
  });
  
  // For current month, use the actual available savings
  if (availableSavings > 0) {
    mockMonthlySavings.set(format(now, 'yyyy-MM'), availableSavings);
  }

  // Calculate remaining amount needed to complete the goal
  const progress = typeof goal.progress === 'number' ? goal.progress : 0;
  const remaining = goal.amount - progress;
  const showDistributeButton = !goal.achieved && availableSavings > 0;

  return (
    <div 
      className={cn(
        "flex flex-col p-3 rounded-md border",
        goal.achieved ? "bg-muted/50" : "bg-background"
      )}
    >
      <div className="flex items-center justify-between">
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
        <div className="flex">
          {!goal.achieved && monthsSinceCreation.length > 1 && (
            <Popover open={showMonthsPopover} onOpenChange={setShowMonthsPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mr-1"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <div className="text-sm font-medium mb-2">Distribute previous savings</div>
                <div className="text-xs text-muted-foreground mb-2">
                  <InfoIcon className="h-3 w-3 inline mr-1" />
                  Only distribute after the month has passed
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {Array.from(mockMonthlySavings.entries()).map(([monthKey, availableSaving]) => {
                    const monthDate = new Date(monthKey + '-01');
                    const isCurrentMonth = isSameMonth(monthDate, now);
                    
                    // If it's the current month, we'll handle it with the main distribute button
                    if (isCurrentMonth && showDistributeButton) return null;
                    
                    return (
                      <Button 
                        key={monthKey}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          if (onDistributeSavings) {
                            onDistributeSavings(availableSaving, goal.id);
                            setShowMonthsPopover(false);
                          }
                        }}
                      >
                        <Calendar className="h-3.5 w-3.5 mr-2" />
                        {format(monthDate, "MMMM yyyy")} distribution
                        <span className="ml-auto font-medium">${availableSaving}</span>
                      </Button>
                    );
                  })}
                  
                  {mockMonthlySavings.size === 0 && (
                    <div className="text-xs text-muted-foreground text-center mt-2">
                      No previous months available
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(goal.id)}
            className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {!goal.achieved && (
        <div className="mt-3 pl-11 space-y-3">
          <SavingGoalProgress goal={goal} />
          
          {showDistributeButton && (
            <Button 
              className="w-full"
              onClick={() => onDistributeSavings && onDistributeSavings(availableSavings, goal.id)}
              variant="outline"
              size="sm"
            >
              Distribute ${availableSavings.toFixed(2)} from {format(now, "MMMM")} to this goal
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

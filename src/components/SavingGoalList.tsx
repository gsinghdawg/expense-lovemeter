
import { useState } from "react";
import { SavingGoal } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, Trash2, Wallet, Calendar, InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, eachMonthOfInterval, isSameMonth } from "date-fns";
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
  onDistributeSavings?: (availableSavings: number) => void;
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

  // Only show Distribute Savings button if there are active goals
  // and there are savings available
  const showDistributeButton = activeGoals.length > 0 && totalAvailableSavings > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Your Saving Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showDistributeButton && (
          <div className="space-y-2">
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
            
            <Button 
              className="w-full"
              onClick={() => onDistributeSavings && onDistributeSavings(totalAvailableSavings)}
              variant="outline"
            >
              Distribute ${totalAvailableSavings.toFixed(2)} in Savings
            </Button>
          </div>
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
                  onDistributeSavings={onDistributeSavings}
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
  onDistributeSavings?: (availableSavings: number) => void;
}

function GoalItem({ goal, onToggle, onDelete, onDistributeSavings }: GoalItemProps) {
  const [showMonthsPopover, setShowMonthsPopover] = useState(false);
  
  // Generate list of months since goal creation until today
  const now = new Date();
  const monthsSinceCreation = eachMonthOfInterval({
    start: goal.created,
    end: now
  });
  
  // Show a dummy savings amount for each month (in a real app, this would be actual data)
  const mockAvailableSavings = 25; // Just for demonstration

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
              <PopoverContent className="w-56 p-2">
                <div className="text-sm font-medium mb-2">Distribute previous savings</div>
                <div className="text-xs text-muted-foreground mb-2">
                  <InfoIcon className="h-3 w-3 inline mr-1" />
                  Only distribute after the month has passed
                </div>
                <div className="space-y-1">
                  {monthsSinceCreation.map((month, index) => {
                    // Skip the current month as it's handled by the main distribute button
                    if (isSameMonth(month, now)) return null;
                    
                    return (
                      <Button 
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          if (onDistributeSavings) {
                            onDistributeSavings(mockAvailableSavings);
                            setShowMonthsPopover(false);
                          }
                        }}
                      >
                        <Calendar className="h-3.5 w-3.5 mr-2" />
                        {format(month, "MMMM yyyy")}
                        <span className="ml-auto font-medium">${mockAvailableSavings}</span>
                      </Button>
                    );
                  })}
                </div>
                {monthsSinceCreation.length <= 1 && (
                  <div className="text-xs text-muted-foreground text-center mt-2">
                    No previous months available
                  </div>
                )}
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
        <div className="mt-3 pl-11">
          <SavingGoalProgress goal={goal} />
        </div>
      )}
    </div>
  );
}

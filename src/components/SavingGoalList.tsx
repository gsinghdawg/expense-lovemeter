
import { useState } from "react";
import { SavingGoal } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, Trash2, Wallet, Calendar, InfoIcon, RotateCcw } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SavingGoalListProps {
  goals: SavingGoal[];
  onToggleGoal: (id: string, achieved: boolean) => void;
  onDeleteGoal: (id: string) => void;
  onDistributeSavings?: (availableSavings: number, goalId: string, monthKey: string) => void;
  onReverseDistribution?: (goalId: string, monthKey: string) => void;
  getRemainingMonthSavings?: (monthKey: string, totalSavings: number) => number;
  monthEndSavings: number;
  recoveredSavings?: number;
}

export function SavingGoalList({
  goals,
  onToggleGoal,
  onDeleteGoal,
  onDistributeSavings,
  onReverseDistribution,
  getRemainingMonthSavings,
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
                  onReverseDistribution={onReverseDistribution}
                  getRemainingMonthSavings={getRemainingMonthSavings}
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
                  onReverseDistribution={onReverseDistribution}
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
  onDistributeSavings?: (availableSavings: number, goalId: string, monthKey: string) => void;
  onReverseDistribution?: (goalId: string, monthKey: string) => void;
  getRemainingMonthSavings?: (monthKey: string, totalSavings: number) => number;
  availableSavings?: number;
}

function GoalItem({ 
  goal, 
  onToggle, 
  onDelete, 
  onDistributeSavings, 
  onReverseDistribution,
  getRemainingMonthSavings,
  availableSavings = 0 
}: GoalItemProps) {
  const [showMonthsPopover, setShowMonthsPopover] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
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
  const currentMonthKey = format(now, 'yyyy-MM');
  if (availableSavings > 0) {
    const remainingSavings = getRemainingMonthSavings 
      ? getRemainingMonthSavings(currentMonthKey, availableSavings) 
      : availableSavings;
    
    if (remainingSavings > 0) {
      mockMonthlySavings.set(currentMonthKey, remainingSavings);
    }
  }

  // Calculate remaining amount needed to complete the goal
  const progress = typeof goal.progress === 'number' ? goal.progress : 0;
  const remaining = goal.amount - progress;
  
  // Only show distribute button if there are remaining savings and the goal isn't achieved
  const showDistributeButton = !goal.achieved && mockMonthlySavings.get(currentMonthKey) > 0;
  
  // Only show reverse button if there's progress made and not achieved yet (or achieved)
  const showReverseButton = progress > 0 && onReverseDistribution;

  const handleDelete = () => {
    // Close the dialog
    setShowDeleteDialog(false);
    
    // Call the delete function
    onDelete(goal.id);
  };

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
                  {Array.from(mockMonthlySavings.entries())
                    .filter(([monthKey, availableSaving]) => {
                      // Current month is handled separately, and only show if there are savings
                      const isCurrentMonth = monthKey === currentMonthKey;
                      if (isCurrentMonth) {
                        return false; // Skip current month in the popover
                      }
                      // For previous months, check if we have savings to distribute
                      const remainingSavings = getRemainingMonthSavings 
                        ? getRemainingMonthSavings(monthKey, availableSaving)
                        : availableSaving;
                      return remainingSavings > 0;
                    })
                    .map(([monthKey, availableSaving]) => {
                      const monthDate = new Date(monthKey + '-01');
                      // Use getRemainingMonthSavings if available
                      const remainingSavings = getRemainingMonthSavings 
                        ? getRemainingMonthSavings(monthKey, availableSaving)
                        : availableSaving;
                      
                      if (remainingSavings <= 0) return null;
                      
                      return (
                        <Button 
                          key={monthKey}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            if (onDistributeSavings) {
                              onDistributeSavings(remainingSavings, goal.id, monthKey);
                              setShowMonthsPopover(false);
                            }
                          }}
                        >
                          <Calendar className="h-3.5 w-3.5 mr-2" />
                          {format(monthDate, "MMMM yyyy")} distribution
                          <span className="ml-auto font-medium">${remainingSavings.toFixed(2)}</span>
                        </Button>
                      );
                    })}
                  
                  {(mockMonthlySavings.size === 0 || Array.from(mockMonthlySavings.entries())
                      .filter(([monthKey]) => monthKey !== currentMonthKey)
                      .every(([monthKey, availableSaving]) => {
                        const remainingSavings = getRemainingMonthSavings 
                          ? getRemainingMonthSavings(monthKey, availableSaving)
                          : availableSaving;
                        return remainingSavings <= 0;
                      })) && (
                    <div className="text-xs text-muted-foreground text-center mt-2">
                      No previous months available
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {/* Show reverse button if there's progress */}
          {showReverseButton && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (onReverseDistribution) {
                        // Use the current month key for simplicity
                        onReverseDistribution(goal.id, currentMonthKey);
                      }
                    }}
                    className="h-8 w-8 mr-1 text-amber-500 hover:text-amber-600 hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reverse contributions to this goal</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Delete button with confirmation dialog */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this saving goal?</AlertDialogTitle>
                <AlertDialogDescription>
                  {progress > 0 
                    ? `This will delete your goal "${goal.purpose}" and return $${progress.toFixed(2)} to your available savings.` 
                    : `This will permanently delete your goal "${goal.purpose}".`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {!goal.achieved && (
        <div className="mt-3 pl-11 space-y-3">
          <SavingGoalProgress goal={goal} />
          
          {showDistributeButton && (
            <Button 
              className="w-full"
              onClick={() => {
                if (onDistributeSavings) {
                  const remainingSavings = getRemainingMonthSavings 
                    ? getRemainingMonthSavings(currentMonthKey, availableSavings)
                    : availableSavings;
                  onDistributeSavings(remainingSavings, goal.id, currentMonthKey);
                }
              }}
              variant="outline"
              size="sm"
            >
              Distribute ${mockMonthlySavings.get(currentMonthKey)?.toFixed(2)} from {format(now, "MMMM")} to this goal
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

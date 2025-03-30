
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
  onToggleGoal: (id: string, achieved: boolean, monthKey?: string) => void;
  onDeleteGoal: (id: string, monthKey?: string) => void;
  onDistributeSavings?: (availableSavings: number, goalId: string, monthKey: string) => void;
  getRemainingMonthSavings?: (monthKey: string, totalSavings: number) => number;
  monthEndSavings?: number;
  recoveredSavings?: number;
}

export function SavingGoalList({
  goals,
  onToggleGoal,
  onDeleteGoal,
  onDistributeSavings,
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

  const activeGoals = goals.filter(goal => !goal.achieved);
  const achievedGoals = goals.filter(goal => goal.achieved);

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
  onToggle: (id: string, achieved: boolean, monthKey?: string) => void;
  onDelete: (id: string, monthKey?: string) => void;
  onDistributeSavings?: (availableSavings: number, goalId: string, monthKey: string) => void;
  getRemainingMonthSavings?: (monthKey: string, totalSavings: number) => number;
  availableSavings?: number;
}

function GoalItem({ 
  goal, 
  onToggle, 
  onDelete, 
  onDistributeSavings, 
  getRemainingMonthSavings,
  availableSavings = 0 
}: GoalItemProps) {
  const [showMonthsPopover, setShowMonthsPopover] = useState(false);
  const [showUnachieveDialog, setShowUnachieveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentMonthKey, setCurrentMonthKey] = useState('');
  
  const now = new Date();
  const past6Months = subMonths(now, 6);
  const startDate = goal.created > past6Months ? goal.created : past6Months;
  
  const monthsSinceCreation = eachMonthOfInterval({
    start: startDate,
    end: now
  });
  
  const mockMonthlySavings = new Map<string, number>();
  
  monthsSinceCreation.forEach((month, index) => {
    if (!isSameMonth(month, now)) {
      const randomSaving = Math.floor(Math.random() * 26) + 5;
      mockMonthlySavings.set(format(month, 'yyyy-MM'), randomSaving);
    }
  });
  
  const thisMonthKey = format(now, 'yyyy-MM');
  if (availableSavings > 0) {
    const remainingSavings = getRemainingMonthSavings 
      ? getRemainingMonthSavings(thisMonthKey, availableSavings) 
      : availableSavings;
    
    if (remainingSavings > 0) {
      mockMonthlySavings.set(thisMonthKey, remainingSavings);
    }
  }

  const progress = typeof goal.progress === 'number' ? goal.progress : 0;
  const remaining = goal.amount - progress;
  const showDistributeButton = !goal.achieved && mockMonthlySavings.get(thisMonthKey) > 0;

  const handleToggle = () => {
    if (goal.achieved) {
      setCurrentMonthKey(thisMonthKey);
      setShowUnachieveDialog(true);
    } else {
      onToggle(goal.id, true);
    }
  };

  const handleConfirmUnachieve = () => {
    onToggle(goal.id, false, currentMonthKey);
    setShowUnachieveDialog(false);
  };

  const handleDelete = () => {
    // For goals with progress, show a confirmation dialog
    if (progress > 0) {
      setCurrentMonthKey(thisMonthKey);
      setShowDeleteDialog(true);
    } else {
      // For goals without progress, delete immediately
      onDelete(goal.id);
    }
  };

  const handleConfirmDelete = () => {
    onDelete(goal.id, currentMonthKey);
    setShowDeleteDialog(false);
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
            onClick={handleToggle}
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
                      const isCurrentMonth = monthKey === thisMonthKey;
                      if (isCurrentMonth) {
                        return false;
                      }
                      const remainingSavings = getRemainingMonthSavings 
                        ? getRemainingMonthSavings(monthKey, availableSaving)
                        : availableSaving;
                      return remainingSavings > 0;
                    })
                    .map(([monthKey, availableSaving]) => {
                      const monthDate = new Date(monthKey + '-01');
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
                      .filter(([monthKey]) => monthKey !== thisMonthKey)
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
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
              onClick={() => {
                if (onDistributeSavings) {
                  const remainingSavings = getRemainingMonthSavings 
                    ? getRemainingMonthSavings(thisMonthKey, availableSavings)
                    : availableSavings;
                  onDistributeSavings(remainingSavings, goal.id, thisMonthKey);
                }
              }}
              variant="outline"
              size="sm"
            >
              Distribute ${mockMonthlySavings.get(thisMonthKey)?.toFixed(2)} from {format(now, "MMMM")} to this goal
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={showUnachieveDialog} onOpenChange={setShowUnachieveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Goal</AlertDialogTitle>
            <AlertDialogDescription>
              This will revert the goal back to active status and return any distributed 
              savings back to your available savings. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUnachieve}>
              Reactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal with Savings</AlertDialogTitle>
            <AlertDialogDescription>
              This goal has ${progress.toFixed(2)} in savings. Deleting will return 
              these funds to your available savings. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

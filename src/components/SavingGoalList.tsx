
import { useState } from "react";
import { SavingGoal } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, Trash2, Wallet, Calendar, InfoIcon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, eachMonthOfInterval, isSameMonth, subMonths, isAfter, endOfMonth, startOfMonth } from "date-fns";
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
  const [showReverseDialog, setShowReverseDialog] = useState(false);
  const [currentMonthKey, setCurrentMonthKey] = useState('');
  
  const now = new Date();
  const today = startOfMonth(now); // First day of current month
  const past6Months = subMonths(now, 6);
  const startDate = goal.created > past6Months ? goal.created : past6Months;
  
  const monthsSinceCreation = eachMonthOfInterval({
    start: startDate,
    end: now
  });
  
  // Create a mock storage for monthly savings data
  const mockMonthlySavings = new Map<string, number>();
  
  // Fill in mock savings data for previous months
  monthsSinceCreation.forEach((month) => {
    // Only add savings for past months (including current month)
    const monthEndDate = endOfMonth(month);
    const randomSaving = Math.floor(Math.random() * 26) + 5;
    const monthKey = format(month, 'yyyy-MM');
    mockMonthlySavings.set(monthKey, randomSaving);
  });
  
  const thisMonthKey = format(now, 'yyyy-MM');
  
  // Add current month's savings if available
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
  
  // Show the "Distribute" button for current month but disable it
  const showDistributeButton = !goal.achieved && mockMonthlySavings.get(thisMonthKey) > 0;

  const handleToggle = () => {
    // Only allow toggling from achieved to not achieved
    if (goal.achieved) {
      setCurrentMonthKey(thisMonthKey);
      setShowUnachieveDialog(true);
    }
    // Do nothing when clicking on an incomplete goal - users must distribute savings
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

  const handleReverse = () => {
    // Only show reverse dialog for goals with progress
    if (progress > 0) {
      setCurrentMonthKey(thisMonthKey);
      setShowReverseDialog(true);
    }
  };

  const handleConfirmReverse = () => {
    // This will reset progress without deleting the goal
    onToggle(goal.id, false, currentMonthKey);
    setShowReverseDialog(false);
  };

  /**
   * Check if a month has ended (it's either a past month or today is the first day of the next month)
   */
  const isMonthCompleted = (monthDate: Date): boolean => {
    const monthEndDate = endOfMonth(monthDate);
    // A month is completed if today is after the end of that month
    // OR if today is the first day of the next month
    return isAfter(now, monthEndDate);
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
            disabled={!goal.achieved} // Disable the button for non-achieved goals
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
                    .map(([monthKey, availableSaving]) => {
                      const monthDate = new Date(monthKey + '-01');
                      const monthCompleted = isMonthCompleted(monthDate);
                      const remainingSavings = getRemainingMonthSavings 
                        ? getRemainingMonthSavings(monthKey, availableSaving)
                        : availableSaving;
                      
                      // Always show buttons for months with savings
                      if (remainingSavings <= 0) return null;
                      
                      return (
                        <Button 
                          key={monthKey}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          disabled={!monthCompleted} // Disable if month is not completed
                          onClick={() => {
                            if (onDistributeSavings && monthCompleted) {
                              onDistributeSavings(remainingSavings, goal.id, monthKey);
                              setShowMonthsPopover(false);
                            }
                          }}
                        >
                          <Calendar className="h-3.5 w-3.5 mr-2" />
                          {format(monthDate, "MMMM yyyy")} distribution
                          <span className="ml-auto font-medium">${remainingSavings.toFixed(2)}</span>
                          {!monthCompleted && (
                            <span className="absolute right-1 top-1 bg-yellow-100 text-yellow-800 text-[9px] px-1 rounded">
                              Month in progress
                            </span>
                          )}
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
          
          {/* Add the Reverse button if there's progress */}
          {progress > 0 && !goal.achieved && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReverse}
              className="h-8 w-8 mr-1 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
              title="Reverse savings contribution"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        const currentMonthCompleted = isMonthCompleted(new Date(thisMonthKey + '-01'));
                        if (onDistributeSavings && currentMonthCompleted) {
                          const remainingSavings = getRemainingMonthSavings 
                            ? getRemainingMonthSavings(thisMonthKey, availableSavings)
                            : availableSavings;
                          onDistributeSavings(remainingSavings, goal.id, thisMonthKey);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      disabled={!isMonthCompleted(new Date(thisMonthKey + '-01'))}
                    >
                      Distribute ${mockMonthlySavings.get(thisMonthKey)?.toFixed(2)} from {format(now, "MMMM")} to this goal
                    </Button>
                  </div>
                </TooltipTrigger>
                {!isMonthCompleted(new Date(thisMonthKey + '-01')) && (
                  <TooltipContent>
                    <p className="text-sm max-w-xs">
                      You can only distribute savings after the month has ended
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
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
      
      <AlertDialog open={showReverseDialog} onOpenChange={setShowReverseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverse Savings Contribution</AlertDialogTitle>
            <AlertDialogDescription>
              This will return ${progress.toFixed(2)} to your available savings while keeping 
              the goal active. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReverse}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Reverse
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

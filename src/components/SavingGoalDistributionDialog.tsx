
import { useState } from "react";
import { SavingGoal } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm, FormProvider } from "react-hook-form";
import { cn } from "@/lib/utils";

interface SavingGoalDistributionDialogProps {
  goals: SavingGoal[];
  availableSavings: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDistribute: (goalIds: string[], amount: number) => void;
}

interface FormValues {
  goalSelections: Record<string, boolean>;
  customAmounts: Record<string, string>;
}

export function SavingGoalDistributionDialog({
  goals,
  availableSavings,
  open,
  onOpenChange,
  onDistribute
}: SavingGoalDistributionDialogProps) {
  const activeGoals = goals.filter(goal => !goal.achieved);
  const [distributionMethod, setDistributionMethod] = useState<"auto" | "custom">("auto");
  
  // Initialize form with all goals selected by default
  const form = useForm<FormValues>({
    defaultValues: {
      goalSelections: Object.fromEntries(activeGoals.map(goal => [goal.id, true])),
      customAmounts: Object.fromEntries(activeGoals.map(goal => [goal.id, "0"]))
    }
  });
  
  const selectedGoalIds = Object.entries(form.watch("goalSelections") || {})
    .filter(([_, isSelected]) => isSelected)
    .map(([id]) => id);
  
  const selectedGoals = activeGoals.filter(goal => selectedGoalIds.includes(goal.id));
  
  // Calculate remaining amount in case of custom distribution
  const totalCustomAmount = selectedGoals.reduce((sum, goal) => {
    const amount = parseFloat(form.watch(`customAmounts.${goal.id}`) || "0");
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const remainingAmount = Math.max(0, availableSavings - totalCustomAmount).toFixed(2);
  
  // Handle submission
  const handleSubmit = () => {
    const selectedGoalIds = Object.entries(form.getValues().goalSelections || {})
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);
    
    if (selectedGoalIds.length === 0) {
      return; // Don't distribute if no goals selected
    }
    
    const amountToDistribute = distributionMethod === "custom" 
      ? totalCustomAmount 
      : availableSavings;
    
    onDistribute(selectedGoalIds, amountToDistribute);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Distribute Savings</DialogTitle>
          <DialogDescription>
            Select which goals you want to distribute ${availableSavings.toFixed(2)} in savings to.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <FormProvider {...form}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant={distributionMethod === "auto" ? "default" : "outline"}
                  onClick={() => setDistributionMethod("auto")}
                >
                  Auto-distribute
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={distributionMethod === "custom" ? "default" : "outline"}
                  onClick={() => setDistributionMethod("custom")}
                >
                  Custom distribution
                </Button>
              </div>
              
              {activeGoals.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {activeGoals.map((goal) => (
                    <div 
                      key={goal.id}
                      className={cn(
                        "flex flex-col p-3 rounded-md border",
                        "bg-background"
                      )}
                    >
                      <div className="flex items-start">
                        <FormField
                          control={form.control}
                          name={`goalSelections.${goal.id}`}
                          render={({ field }) => (
                            <FormItem className="flex items-start space-x-3 space-y-0 mt-1">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 flex-1">
                                <FormLabel className="font-medium">{goal.purpose}</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  <div>
                                    Target: ${goal.amount.toFixed(2)}
                                  </div>
                                  <div>
                                    Current progress: ${goal.progress.toFixed(2)} ({Math.round((goal.progress / goal.amount) * 100)}%)
                                  </div>
                                  <div>
                                    Remaining: ${(goal.amount - goal.progress).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {distributionMethod === "custom" && form.watch(`goalSelections.${goal.id}`) && (
                        <div className="ml-7 mt-2">
                          <FormField
                            control={form.control}
                            name={`customAmounts.${goal.id}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="flex items-center">
                                    <span className="mr-2">$</span>
                                    <Input
                                      {...field}
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max={availableSavings.toString()}
                                      className="w-24"
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const numVal = parseFloat(val);
                                        if (isNaN(numVal) || numVal < 0) {
                                          field.onChange("0");
                                        } else if (numVal > availableSavings) {
                                          field.onChange(availableSavings.toString());
                                        } else {
                                          field.onChange(val);
                                        }
                                      }}
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No active goals to distribute savings to.
                </div>
              )}
              
              {distributionMethod === "custom" && (
                <div className="text-sm flex justify-between border-t pt-2">
                  <span>Remaining:</span>
                  <span className={remainingAmount === "0.00" || parseFloat(remainingAmount) > 0 ? "" : "text-red-500"}>
                    ${remainingAmount}
                  </span>
                </div>
              )}
            </div>
          </FormProvider>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={selectedGoalIds.length === 0 || (distributionMethod === "custom" && parseFloat(remainingAmount) < 0)}
          >
            Distribute Savings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { SavingGoal } from "@/types/expense";
import { SavingGoalForm } from "@/components/SavingGoalForm";
import { SavingGoalList } from "@/components/SavingGoalList";

interface SavingGoalSectionProps {
  goals: SavingGoal[];
  onAddGoal: (goal: { amount: number; purpose: string }) => void;
  onToggleGoal: (id: string, achieved: boolean, monthKey?: string) => void;
  onDeleteGoal: (id: string, monthKey?: string) => void;
  onDistributeSavings: (amount: number, goalId: string, monthKey: string) => void;
  getRemainingMonthSavings?: (monthKey: string, totalSavings: number) => number;
  monthEndSavings: number;
  recoveredSavings?: number;
}

export function SavingGoalSection({
  goals,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
  onDistributeSavings,
  getRemainingMonthSavings,
  monthEndSavings,
  recoveredSavings = 0
}: SavingGoalSectionProps) {
  const handleReverseGoal = (id: string, monthKey?: string) => {
    onDeleteGoal(id, monthKey, true);
  };

  return (
    <div className="space-y-6">
      <SavingGoalForm onSubmit={onAddGoal} />
      <SavingGoalList 
        goals={goals} 
        onToggleGoal={onToggleGoal} 
        onDeleteGoal={onDeleteGoal}
        onDistributeSavings={onDistributeSavings}
        getRemainingMonthSavings={getRemainingMonthSavings}
        monthEndSavings={monthEndSavings}
        recoveredSavings={recoveredSavings}
      />
    </div>
  );
}

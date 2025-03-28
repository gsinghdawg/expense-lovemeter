
import { SavingGoal } from "@/types/expense";
import { SavingGoalForm } from "@/components/SavingGoalForm";
import { SavingGoalList } from "@/components/SavingGoalList";

interface SavingGoalSectionProps {
  goals: SavingGoal[];
  onAddGoal: (goal: { amount: number; purpose: string }) => void;
  onToggleGoal: (id: string, achieved: boolean) => void;
  onDeleteGoal: (id: string) => void;
  onDistributeSavings: (goalIds: string[], amount: number) => void;
  monthEndSavings: number;
}

export function SavingGoalSection({
  goals,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
  onDistributeSavings,
  monthEndSavings
}: SavingGoalSectionProps) {
  const handleDistributeSavings = (goalIds: string[], amount: number) => {
    console.log('SavingGoalSection handleDistributeSavings:', { goalIds, amount });
    onDistributeSavings(goalIds, amount);
  };

  return (
    <div className="space-y-6">
      <SavingGoalForm onSubmit={onAddGoal} />
      <SavingGoalList 
        goals={goals} 
        onToggleGoal={onToggleGoal} 
        onDeleteGoal={onDeleteGoal}
        onDistributeSavings={handleDistributeSavings}
        monthEndSavings={monthEndSavings}
      />
    </div>
  );
}

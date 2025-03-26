
import { SavingGoal } from "@/types/expense";
import { SavingGoalForm } from "@/components/SavingGoalForm";
import { SavingGoalList } from "@/components/SavingGoalList";

interface SavingGoalSectionProps {
  goals: SavingGoal[];
  onAddGoal: (goal: { amount: number; purpose: string }) => void;
  onToggleGoal: (id: string, achieved: boolean) => void;
  onDeleteGoal: (id: string) => void;
}

export function SavingGoalSection({
  goals,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal
}: SavingGoalSectionProps) {
  return (
    <div className="space-y-6">
      <SavingGoalForm onSubmit={onAddGoal} />
      <SavingGoalList 
        goals={goals} 
        onToggleGoal={onToggleGoal} 
        onDeleteGoal={onDeleteGoal} 
      />
    </div>
  );
}

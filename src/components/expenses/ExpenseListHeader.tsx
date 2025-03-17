
import React from 'react';

type ExpenseListHeaderProps = {
  expenseCount: number;
};

export function ExpenseListHeader({ expenseCount }: ExpenseListHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold">All Transactions</h2>
      <div className="text-sm text-muted-foreground">
        {expenseCount} {expenseCount === 1 ? 'expense' : 'expenses'} found
      </div>
    </div>
  );
}

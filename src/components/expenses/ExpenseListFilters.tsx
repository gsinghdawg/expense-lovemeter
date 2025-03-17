
import React from 'react';
import { ExpenseCategory } from '@/types/expense';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ExpenseListFiltersProps = {
  filterText: string;
  filterCategory: string;
  setFilterText: (text: string) => void;
  setFilterCategory: (categoryId: string) => void;
  categories: ExpenseCategory[];
};

export function ExpenseListFilters({
  filterText,
  filterCategory,
  setFilterText,
  setFilterCategory,
  categories,
}: ExpenseListFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Input
        placeholder="Search expenses..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        className="sm:flex-1"
      />
      <Select
        value={filterCategory}
        onValueChange={setFilterCategory}
      >
        <SelectTrigger className="sm:w-[180px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

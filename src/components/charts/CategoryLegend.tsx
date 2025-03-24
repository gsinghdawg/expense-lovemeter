
import { ExpenseCategory } from "@/types/expense";

type CategoryLegendProps = {
  categories: {
    name: string;
    value: number;
    color: string;
    percentage: number;
  }[];
};

export function CategoryLegend({ categories }: CategoryLegendProps) {
  if (categories.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      {categories.map((item, index) => (
        <div key={index} className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm">{item.name}</span>
          </div>
          <span className="text-sm font-medium">${item.value.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

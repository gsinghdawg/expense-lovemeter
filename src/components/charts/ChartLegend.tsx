
import React from "react";

type LegendItem = {
  color: string;
  label: string;
  type?: "line" | "bar" | "dashed";
  height?: number;
};

type ChartLegendProps = {
  items: LegendItem[];
};

export function ChartLegend({ items }: ChartLegendProps) {
  return (
    <div className="flex items-center justify-center space-x-6 mt-2 text-xs text-muted-foreground">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {item.type === "line" ? (
            <div className={`w-3 h-${item.height || 1} bg-[${item.color}] mr-1`}></div>
          ) : item.type === "dashed" ? (
            <div className={`w-3 h-${item.height || 1} bg-[${item.color}] mr-1 border-dashed border-t`}></div>
          ) : (
            <div className={`w-3 h-3 bg-[${item.color}] mr-1 cursor-pointer`}></div>
          )}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

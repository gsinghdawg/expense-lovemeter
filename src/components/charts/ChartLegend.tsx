
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
            <div 
              className={`w-6 h-${item.height || 1} mr-1.5`} 
              style={{ backgroundColor: item.color }}
            ></div>
          ) : item.type === "dashed" ? (
            <div 
              className={`w-6 h-${item.height || 1} mr-1.5 border-t-2 border-dashed`} 
              style={{ borderColor: item.color }}
            ></div>
          ) : (
            <div 
              className="w-3 h-3 mr-1.5" 
              style={{ backgroundColor: item.color }}
            ></div>
          )}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

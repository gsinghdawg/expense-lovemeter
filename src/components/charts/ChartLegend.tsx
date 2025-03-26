
import React from 'react';

type LegendItemType = 'line' | 'bar' | 'dashed' | 'dot' | 'scatter';

type LegendItem = {
  color: string;
  label: string;
  type: LegendItemType;
  height?: number;
};

type ChartLegendProps = {
  items: LegendItem[];
};

export function ChartLegend({ items }: ChartLegendProps) {
  const renderIcon = (item: LegendItem) => {
    const { type, color, height = 3 } = item;
    
    switch (type) {
      case 'line':
        return (
          <div className="inline-block h-4 w-8 relative">
            <div 
              className="absolute inset-y-0 my-auto h-px w-full" 
              style={{ backgroundColor: color, height: `${height}px` }}
            />
          </div>
        );
      case 'dashed':
        return (
          <div className="inline-block h-4 w-8 relative">
            <div 
              className="absolute inset-y-0 my-auto h-px w-full" 
              style={{ 
                backgroundColor: 'transparent',
                height: `${height}px`,
                backgroundImage: `repeating-linear-gradient(to right, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)` 
              }}
            />
          </div>
        );
      case 'bar':
        return (
          <div 
            className="inline-block h-3 w-3" 
            style={{ backgroundColor: color }}
          />
        );
      case 'scatter':
        return (
          <div className="inline-block h-4 w-8 relative">
            <div 
              className="absolute inset-0 m-auto h-3 w-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <div 
              className="absolute inset-y-0 my-auto h-px w-full" 
              style={{ 
                backgroundColor: 'transparent',
                height: '1px',
                backgroundImage: `repeating-linear-gradient(to right, ${color} 0, ${color} 2px, transparent 2px, transparent 4px)` 
              }}
            />
          </div>
        );
      case 'dot':
      default:
        return (
          <div 
            className="inline-block h-3 w-3 rounded-full" 
            style={{ backgroundColor: color }}
          />
        );
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-2 pb-2 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {renderIcon(item)}
          <span className="text-xs">{item.label}</span>
        </div>
      ))}
    </div>
  );
}


import React from "react";

type StatProps = {
  label: string;
  value: string | number;
  colorClass?: string;
  subtext?: string;
};

export function Stat({ label, value, colorClass, subtext }: StatProps) {
  return (
    <div className={`bg-slate-50 dark:bg-slate-800 p-3 rounded-md ${colorClass || ""}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium">
        {value}
        {subtext && <span className="text-xs ml-1">{subtext}</span>}
      </p>
    </div>
  );
}

type StatsGridProps = {
  stats: StatProps[];
  columns?: number;
};

export function StatsGrid({ stats, columns = 3 }: StatsGridProps) {
  return (
    <div className={`mt-4 grid grid-cols-${columns} gap-4 text-center`}>
      {stats.map((stat, index) => (
        <Stat key={index} {...stat} />
      ))}
    </div>
  );
}

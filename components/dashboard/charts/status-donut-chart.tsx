"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { StatusBreakdown } from "@/lib/dashboard-data";

interface Props {
  data: StatusBreakdown[];
}

const labelMap: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export function StatusDonutChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[180px] w-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              strokeWidth={0}
              paddingAngle={3}
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} className="transition-opacity hover:opacity-80" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0];
                return (
                  <div className="rounded-lg border px-3 py-2 text-xs shadow-lg" style={{ background: "rgba(15,15,26,0.95)", borderColor: "rgba(99,102,241,0.2)" }}>
                    <p className="text-white font-medium">{labelMap[d.name as string] ?? d.name}</p>
                    <p style={{ color: d.payload?.color }}>{d.value} task{Number(d.value) !== 1 ? "s" : ""}</p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{total}</span>
          <span className="text-[11px] text-text-muted">Total</span>
        </div>
      </div>
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {data.map((d) => (
          <div key={d.status} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-text-muted">
              {labelMap[d.status] ?? d.status}
            </span>
            <span className="font-medium text-white">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DataPoint {
  name: string;
  value: number;
  symbol: string;
}

interface Props {
  data: DataPoint[];
}

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#14b8a6",
];

export default function PortfolioDonutChart({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => [
            `$${value.toLocaleString("en", { maximumFractionDigits: 0 })}`,
            name,
          ]}
        />
        <Legend
          formatter={(value) => <span style={{ color: "#9ca3af", fontSize: "11px" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

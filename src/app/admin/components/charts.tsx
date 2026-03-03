"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ActivityData {
  date: string;
  count: number;
}

export function ActivityChart({ data }: { data: ActivityData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00ff41" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          stroke="#1a3a1a"
          tick={{ fill: "#3a3a3a", fontSize: 9, fontFamily: "monospace" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#1a3a1a"
          tick={{ fill: "#3a3a3a", fontSize: 9, fontFamily: "monospace" }}
          tickLine={false}
          width={28}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "#0a0a0a",
            border: "1px solid #1a3a1a",
            borderRadius: "2px",
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#00ff41",
          }}
          labelStyle={{ color: "#505050" }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#00ff41"
          fill="url(#greenGradient)"
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface FlavorData {
  name: string;
  count: number;
}

export function FlavorChart({ data }: { data: FlavorData[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 28)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <XAxis
          type="number"
          stroke="#1a3a1a"
          tick={{ fill: "#3a3a3a", fontSize: 9, fontFamily: "monospace" }}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#1a3a1a"
          tick={{ fill: "#606060", fontSize: 9, fontFamily: "monospace" }}
          tickLine={false}
          width={90}
        />
        <Tooltip
          contentStyle={{
            background: "#0a0a0a",
            border: "1px solid #1a3a1a",
            borderRadius: "2px",
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#00ff41",
          }}
        />
        <Bar
          dataKey="count"
          fill="#00ff41"
          opacity={0.75}
          radius={[0, 2, 2, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ShareData {
  name: string;
  value: number;
}

const COLORS = [
  "#00ff41",
  "#00d4ff",
  "#ffb000",
  "#ff0033",
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#ec4899",
];

export function SharesChart({ data }: { data: ShareData[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={70}
          dataKey="value"
          stroke="#0a0a0a"
          strokeWidth={2}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#0a0a0a",
            border: "1px solid #1a3a1a",
            borderRadius: "2px",
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#00ff41",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

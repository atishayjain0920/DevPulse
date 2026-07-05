import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = Record<string, string | number>;

const colors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#0891b2"];

export function TrendChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="trend" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area type="monotone" dataKey="commits" stroke="#2563eb" fill="url(#trend)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ChurnChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="repository" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="additions" fill="#16a34a" />
        <Bar dataKey="deletions" fill="#dc2626" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Tooltip />
        <Pie data={data} innerRadius={58} outerRadius={86} dataKey="value" nameKey="name">
          {data.map((_entry, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function Heatmap({ data }: { data: Array<{ date: string; count: number; level: number }> }) {
  return (
    <div className="heatmap" aria-label="Contribution heatmap">
      {data.map((day) => (
        <span key={day.date} title={`${day.date}: ${day.count}`} data-level={day.level} />
      ))}
    </div>
  );
}

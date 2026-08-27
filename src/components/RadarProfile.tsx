"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export interface RadarPoint {
  dimension: string;
  score: number;
}

export default function RadarProfile({ data }: { data: RadarPoint[] }) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="#cbd5e1" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "#475569", fontSize: 12 }}
          />
          <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
          <Radar
            dataKey="score"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

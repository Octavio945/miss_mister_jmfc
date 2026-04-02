"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";

interface Candidate {
  id: string;
  name: string;
  totalVotes: number;
  number: number;
}

interface VotesBarChartProps {
  data: Candidate[];
  title: string;
  color: string;
}

export default function VotesBarChart({ data, title, color }: VotesBarChartProps) {
  // Sort by votes for better visualization in chart
  const chartData = [...data].sort((a, b) => b.totalVotes - a.totalVotes);

  return (
    <div className="bg-white dark:bg-[#111] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/10 w-full h-[400px] flex flex-col">
      <h3 className="text-xl font-bold font-serif mb-6">{title}</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888822" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100} 
              tick={{ fontSize: 12, fill: 'currentColor' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ 
                backgroundColor: '#111', 
                border: 'none', 
                borderRadius: '12px',
                color: '#fff' 
              }}
              itemStyle={{ color: color }}
            />
            <Bar 
              dataKey="totalVotes" 
              radius={[0, 4, 4, 0]} 
              barSize={20}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8 - (index * 0.1)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

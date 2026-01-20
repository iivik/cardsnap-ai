import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { CategoryStats } from "@/lib/analytics-utils";

interface CategoryChartProps {
  data: CategoryStats[];
}

// Category-specific colors - vibrant Apple-inspired palette
const CATEGORY_COLORS: Record<string, string> = {
  "Client": "hsl(160, 84%, 45%)",           // Emerald green
  "Prospect - Client": "hsl(38, 95%, 55%)", // Vibrant amber
  "Prospect - Partner": "hsl(280, 70%, 60%)", // Purple
  "Partner": "hsl(217, 91%, 60%)",          // Blue
  "Influencer": "hsl(328, 85%, 60%)",       // Pink
  "Random/Other": "hsl(220, 14%, 55%)",     // Gray
};

// Fallback colors for unknown categories
const FALLBACK_COLORS = [
  "hsl(340, 82%, 55%)",  // Pink/Rose
  "hsl(25, 95%, 55%)",   // Orange
  "hsl(173, 80%, 45%)",  // Teal
  "hsl(262, 83%, 60%)",  // Purple
  "hsl(142, 71%, 50%)",  // Green
];

export function CategoryChart({ data }: CategoryChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.label,
    value: item.count,
    color: CATEGORY_COLORS[item.label] || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={2}
            stroke="hsl(var(--background))"
            label={({ name, percent }) => 
              percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
            }
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: data.color }}
                      />
                      <p className="text-sm font-medium text-foreground">{data.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {data.value} contacts ({((data.value / total) * 100).toFixed(1)}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-xs text-foreground ml-1">{value}</span>
            )}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
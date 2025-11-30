import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StudentPerformanceData {
  name: string;
  level: number;
  floor: number;
  battlesWon: number;
  battlesLost: number;
}

interface StudentPerfChartProps {
  data: StudentPerformanceData[];
}

export default function StudentPerfChart({ data }: StudentPerfChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
          }}
        />
        <Legend />
        <Bar dataKey="level" fill="hsl(var(--primary))" />
        <Bar dataKey="floor" fill="hsl(var(--secondary))" />
        <Bar dataKey="battlesWon" fill="hsl(var(--accent))" />
        <Bar dataKey="battlesLost" fill="hsl(var(--destructive))" />
      </BarChart>
    </ResponsiveContainer>
  );
}
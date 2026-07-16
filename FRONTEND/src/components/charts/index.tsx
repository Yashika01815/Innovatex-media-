import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, FunnelChart, Funnel, LabelList,
} from 'recharts';
import { Card, CardHeader, EmptyState } from '@/components/ui';

export const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6'];

const axisStyle = { fontSize: 11, fill: '#94a3b8' };
const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 24px -8px rgba(15,23,42,0.18)', fontSize: 12 },
};

function ChartCard({ title, subtitle, action, children, height = 260 }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; height?: number }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} action={action} />
      <div className="px-2 py-4" style={{ height }}>
        {children}
      </div>
    </Card>
  );
}

type Datum = { name: string; value: number; color?: string };

export function BarChartCard({ title, subtitle, data, color = '#6366f1', horizontal, action }: { title: string; subtitle?: string; data: Datum[]; color?: string; horizontal?: boolean; action?: React.ReactNode }) {
  if (!data.length) return <ChartCard title={title} subtitle={subtitle}><EmptyState title="No data yet" /></ChartCard>;
  return (
    <ChartCard title={title} subtitle={subtitle} action={action}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 4, right: 12, left: horizontal ? 8 : -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={!horizontal} horizontal={horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} width={90} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} interval={0} angle={data.length > 5 ? -20 : 0} textAnchor={data.length > 5 ? 'end' : 'middle'} height={data.length > 5 ? 50 : 30} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            </>
          )}
          <Tooltip {...tooltipStyle} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color ?? color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function LineChartCard({ title, subtitle, data, color = '#6366f1', area }: { title: string; subtitle?: string; data: Datum[]; color?: string; area?: boolean }) {
  const Comp = area ? AreaChart : LineChart;
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <Comp data={data} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          {area ? (
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#grad-${color})`} />
          ) : (
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          )}
        </Comp>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DonutChartCard({ title, subtitle, data }: { title: string; subtitle?: string; data: Datum[] }) {
  if (!data.length) return <ChartCard title={title} subtitle={subtitle}><EmptyState title="No data yet" /></ChartCard>;
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function FunnelChartCard({ title, subtitle, data }: { title: string; subtitle?: string; data: Datum[] }) {
  const withColor = data.map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] }));
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip {...tooltipStyle} />
          <Funnel dataKey="value" data={withColor} isAnimationActive>
            <LabelList position="right" fill="#475569" stroke="none" dataKey="name" fontSize={12} />
            <LabelList position="left" fill="#0f172a" stroke="none" dataKey="value" fontSize={12} fontWeight={700} />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

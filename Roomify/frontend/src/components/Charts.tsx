import React from 'react';

// ─── Animated Bar Chart ─────────────────────────────────────────────────────
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showValues?: boolean;
  unit?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 200, showValues = true, unit = '' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 w-full" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            {showValues && (
              <span className="text-[10px] font-black text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {unit}{d.value.toLocaleString('en-IN')}
              </span>
            )}
            <div
              className="w-full rounded-t-lg transition-all duration-700 ease-out group-hover:opacity-80 min-h-[4px]"
              style={{
                height: `${pct}%`,
                background: d.color || 'linear-gradient(to top, #006B5C, #00C9A7)',
                animationDelay: `${i * 80}ms`,
              }}
            />
            <span className="text-[10px] font-bold text-primary/50 mt-1 truncate max-w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Stacked Bar Chart ──────────────────────────────────────────────────────
interface StackedBarData {
  label: string;
  values: { value: number; color: string; legend: string }[];
}

export const StackedBarChart: React.FC<{ data: StackedBarData[]; height?: number }> = ({ data, height = 200 }) => {
  const maxTotal = Math.max(...data.map(d => d.values.reduce((s, v) => s + v.value, 0)), 1);
  return (
    <div className="flex items-end gap-2 w-full" style={{ height }}>
      {data.map((d, i) => {
        const total = d.values.reduce((s, v) => s + v.value, 0);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full flex flex-col-reverse rounded-t-lg overflow-hidden" style={{ height: `${(total / maxTotal) * 100}%` }}>
              {d.values.map((v, j) => (
                <div
                  key={j}
                  className="w-full transition-all duration-700"
                  style={{ height: `${total > 0 ? (v.value / total) * 100 : 0}%`, background: v.color, minHeight: v.value > 0 ? 2 : 0 }}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-primary/50 mt-1">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Donut / Pie Chart ──────────────────────────────────────────────────────
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, size = 180, thickness = 32, centerLabel, centerValue }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {data.map((d, i) => {
          const pct = d.value / total;
          const dashLength = pct * circumference;
          const dashOffset = -offset;
          offset += dashLength;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          );
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <span className="text-2xl font-black text-primary font-headline">{centerValue}</span>}
          {centerLabel && <span className="text-[10px] font-bold text-primary/50 uppercase tracking-wider">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
};

// ─── Mini Sparkline ─────────────────────────────────────────────────────────
export const Sparkline: React.FC<{ values: number[]; color?: string; height?: number }> = ({ values, color = '#006B5C', height = 40 }) => {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * w;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <polyline fill={`${color}20`} stroke="none" points={`0,${height} ${points} ${w},${height}`} />
    </svg>
  );
};

// ─── Legend ──────────────────────────────────────────────────────────────────
export const ChartLegend: React.FC<{ items: { label: string; color: string; value?: string }[] }> = ({ items }) => (
  <div className="flex flex-wrap gap-3 mt-3">
    {items.map((item, i) => (
      <div key={i} className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
        <span className="text-xs font-bold text-primary/60">{item.label}</span>
        {item.value && <span className="text-xs font-black text-primary">{item.value}</span>}
      </div>
    ))}
  </div>
);

import type { ReactNode } from 'react';

type StatsCardColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: StatsCardColor;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const COLOR_CLASSES: Record<StatsCardColor, { icon: string; iconWrap: string; border: string }> = {
  blue: {
    icon: 'text-blue-600',
    iconWrap: 'bg-blue-100',
    border: 'border-blue-200',
  },
  green: {
    icon: 'text-green-600',
    iconWrap: 'bg-green-100',
    border: 'border-green-200',
  },
  yellow: {
    icon: 'text-amber-600',
    iconWrap: 'bg-amber-100',
    border: 'border-amber-200',
  },
  red: {
    icon: 'text-red-600',
    iconWrap: 'bg-red-100',
    border: 'border-red-200',
  },
  purple: {
    icon: 'text-purple-600',
    iconWrap: 'bg-purple-100',
    border: 'border-purple-200',
  },
  gray: {
    icon: 'text-gray-600',
    iconWrap: 'bg-gray-100',
    border: 'border-gray-200',
  },
};

export function StatsCard({ title, value, icon, color, subtitle, trend }: StatsCardProps) {
  const theme = COLOR_CLASSES[color] || COLOR_CLASSES.gray;

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${theme.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
        </div>
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${theme.iconWrap} ${theme.icon}`}>
          {icon}
        </span>
      </div>

      {trend ? (
        <div className="mt-3">
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
              trend.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default StatsCard;

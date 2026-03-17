import { IconType } from 'react-icons';

interface StatsCardProps {
  title: string;
  value: number;
  icon: IconType;
  color: string;
}

export default function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  return (
    <div className="stats-card">
      <div className={`stats-card-icon bg-${color}-100 text-${color}-600`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="stats-card-title">{title}</div>
      <div className="stats-card-value">{value}</div>
    </div>
  );
}

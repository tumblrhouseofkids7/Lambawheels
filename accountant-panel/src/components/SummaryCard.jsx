import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const SummaryCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, trendValue }) => {
  const colorMap = {
    blue: {
      bg: 'bg-white',
      border: 'border-gray-200',
      icon: 'bg-blue-50 text-blue-600',
      text: 'text-gray-900',
    },
    emerald: {
      bg: 'bg-white',
      border: 'border-gray-200',
      icon: 'bg-emerald-50 text-emerald-600',
      text: 'text-gray-900',
    },
    violet: {
      bg: 'bg-white',
      border: 'border-gray-200',
      icon: 'bg-violet-50 text-violet-600',
      text: 'text-gray-900',
    },
    amber: {
      bg: 'bg-white',
      border: 'border-gray-200',
      icon: 'bg-amber-50 text-amber-600',
      text: 'text-gray-900',
    },
    zinc: {
      bg: 'bg-white',
      border: 'border-gray-200',
      icon: 'bg-gray-100 text-gray-800',
      text: 'text-gray-900',
    },
  };

  const c = colorMap[color] || colorMap.blue;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';

  return (
    <div className={`relative rounded-2xl ${c.bg} border ${c.border} shadow-sm p-5 flex flex-col gap-4 fade-in hover:shadow-md hover:border-gray-300 transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center`}>
          <Icon size={22} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={14} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{title}</p>
        <p className="text-gray-900 text-2xl font-extrabold mt-1 tracking-tight">{value}</p>
        {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default SummaryCard;

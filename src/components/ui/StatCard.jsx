import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, change, changeLabel, icon: Icon, color = 'primary' }) {
  const isPositive = change >= 0;
  const colorMap = {
    primary: 'from-primary-500 to-emerald-400',
    blue: 'from-blue-500 to-cyan-400',
    purple: 'from-purple-500 to-violet-400',
    orange: 'from-orange-500 to-amber-400',
  };

  return (
    <div className="card p-5 group">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}{change}%
              </span>
              {changeLabel && <span className="text-xs text-slate-400">{changeLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 bg-gradient-to-br ${colorMap[color]} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

import { TrendingUp, MousePointer, DollarSign, Target, Eye } from 'lucide-react'
import type { KPI } from '../types'

function fmt(n: number, decimals = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(decimals)
}

interface CardProps {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent?: string
}

function Card({ label, value, sub, icon, accent = 'text-blue-400' }: CardProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start gap-3">
      <div className={`mt-0.5 ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-semibold text-white mt-0.5 font-mono">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function KPICards({ kpi }: { kpi: KPI }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Card
        label="Spend"
        value={`$${fmt(kpi.cost, 0)}`}
        icon={<DollarSign size={18} />}
        accent="text-orange-400"
      />
      <Card
        label="Impressions"
        value={fmt(kpi.impressions)}
        icon={<Eye size={18} />}
        accent="text-slate-400"
      />
      <Card
        label="Clicks"
        value={fmt(kpi.clicks)}
        sub={`${kpi.ctr}% CTR`}
        icon={<MousePointer size={18} />}
        accent="text-blue-400"
      />
      <Card
        label="Conversions"
        value={String(kpi.conversions.toFixed(1))}
        icon={<Target size={18} />}
        accent="text-green-400"
      />
      <Card
        label="CPA"
        value={kpi.cpa ? `$${fmt(kpi.cpa, 2)}` : '—'}
        icon={<TrendingUp size={18} />}
        accent="text-purple-400"
      />
    </div>
  )
}

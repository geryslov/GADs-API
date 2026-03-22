import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Download } from 'lucide-react'
import type { Campaign } from '../types'
import { exportCsv } from '../utils/exportCsv'

const STATUS_COLOR: Record<string, string> = {
  ENABLED: 'bg-green-900 text-green-300',
  PAUSED: 'bg-yellow-900 text-yellow-300',
  REMOVED: 'bg-red-900 text-red-300',
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function CampaignTable({ campaigns }: { campaigns: Campaign[] }) {
  const chartData = campaigns
    .filter((c) => c.cost > 0)
    .slice(0, 10)
    .map((c) => ({ name: c.name.length > 22 ? c.name.slice(0, 22) + '…' : c.name, cost: c.cost }))

  return (
    <div className="space-y-4">
      {/* Spend chart */}
      {chartData.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Spend by Campaign (Top 10)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis
                type="number"
                tickFormatter={(v) => `$${fmt(v)}`}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'Spend']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#f97316' : '#2563eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Campaigns</span>
          <button
            onClick={() => exportCsv(campaigns as unknown as Record<string, unknown>[], 'campaigns')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-green-400 transition-colors"
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Campaign', 'Status', 'Channel', 'Impr', 'Clicks', 'CTR', 'Spend', 'Conv', 'CPA'].map((h) => (
                  <th key={h} className="text-left text-slate-400 text-xs uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-2.5 text-slate-200 max-w-[200px] truncate" title={c.name}>
                    {c.name}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[c.status] ?? 'bg-slate-700 text-slate-300'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{c.channel.replace('_', ' ')}</td>
                  <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{fmt(c.impressions)}</td>
                  <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{fmt(c.clicks)}</td>
                  <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{c.ctr}%</td>
                  <td className="px-4 py-2.5 text-orange-300 font-mono text-xs font-medium">${c.cost.toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    <span className={c.conversions > 0 ? 'text-green-400' : 'text-slate-500'}>{c.conversions}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">
                    {c.cpa ? `$${c.cpa.toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No campaigns found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

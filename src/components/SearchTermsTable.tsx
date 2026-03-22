import { useState } from 'react'
import { Search, Download } from 'lucide-react'
import type { SearchTerm } from '../types'
import { exportCsv } from '../utils/exportCsv'

const STATUS_COLOR: Record<string, string> = {
  ADDED: 'bg-green-900/60 text-green-300',
  EXCLUDED: 'bg-red-900/60 text-red-300',
  NONE: 'bg-slate-700 text-slate-400',
}

export function SearchTermsTable({ terms }: { terms: SearchTerm[] }) {
  const [filter, setFilter] = useState('')
  const [campaign, setCampaign] = useState('all')

  const campaigns = ['all', ...Array.from(new Set(terms.map((t) => t.campaign)))]

  const filtered = terms.filter((t) => {
    const matchText = t.term.toLowerCase().includes(filter.toLowerCase())
    const matchCamp = campaign === 'all' || t.campaign === campaign
    return matchText && matchCamp
  })

  // Flagged: high cost, 0 conversions
  const flagged = filtered.filter((t) => t.cost > 20 && t.conversions === 0)
  const normal = filtered.filter((t) => !(t.cost > 20 && t.conversions === 0))
  const sorted = [...flagged, ...normal]

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter search terms…"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <select
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          {campaigns.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'All campaigns' : c}</option>
          ))}
        </select>
        <button
          onClick={() => exportCsv(sorted as unknown as Record<string, unknown>[], 'search-terms')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-green-400 border border-slate-700 hover:border-green-700 bg-slate-800 rounded-lg px-3 py-2 transition-colors"
        >
          <Download size={12} /> Export CSV
        </button>
      </div>

      {flagged.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-900/20 border border-amber-800/40 rounded-lg px-3 py-2">
          <span className="font-medium">⚠ {flagged.length} terms flagged</span>
          <span className="text-amber-500">— cost &gt;$20 with zero conversions (shown first)</span>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Search Term', 'Campaign', 'Status', 'Impr', 'Clicks', 'CTR', 'Cost', 'Conv'].map((h) => (
                  <th key={h} className="text-left text-slate-400 text-xs uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 200).map((t, i) => {
                const isFlagged = t.cost > 20 && t.conversions === 0
                return (
                  <tr
                    key={i}
                    className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${isFlagged ? 'bg-amber-900/10' : ''}`}
                  >
                    <td className="px-4 py-2 text-slate-200 max-w-[260px]">
                      <span className="font-mono text-xs">{t.term}</span>
                    </td>
                    <td className="px-4 py-2 text-slate-400 text-xs max-w-[160px] truncate" title={t.campaign}>
                      {t.campaign}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[t.status] ?? 'bg-slate-700 text-slate-400'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-300 font-mono text-xs">{t.impressions.toLocaleString()}</td>
                    <td className="px-4 py-2 text-slate-300 font-mono text-xs">{t.clicks}</td>
                    <td className="px-4 py-2 text-slate-300 font-mono text-xs">{t.ctr}%</td>
                    <td className={`px-4 py-2 font-mono text-xs font-medium ${isFlagged ? 'text-amber-400' : 'text-orange-300'}`}>
                      ${t.cost.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      <span className={t.conversions > 0 ? 'text-green-400' : 'text-slate-500'}>{t.conversions}</span>
                    </td>
                  </tr>
                )
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">No search terms found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-700 px-4 py-2 text-xs text-slate-500">
          Showing {Math.min(sorted.length, 200)} of {terms.length} terms
        </div>
      </div>
    </div>
  )
}

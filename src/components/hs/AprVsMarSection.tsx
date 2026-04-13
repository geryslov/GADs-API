import { TrendingDown, TrendingUp, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import data from '../../data/mom_aprmar.json'

const PLANTS = ['Less than 15', '15-30', '30-100', 'More than 100']
const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6']

function shorten(s: string, n = 50) {
  if (!s) return s
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export function AprVsMarSection() {
  const mar = data.periods.March
  const apr = data.periods.April
  const delta = data.totalDelta
  const deltaPct = data.totalDeltaPct

  const volumeChart = [
    { period: 'Mar 1-12', contacts: mar.contacts },
    { period: 'Apr 1-12', contacts: apr.contacts },
  ]
  const qualityChart = [
    { period: 'Mar 1-12', ...Object.fromEntries(PLANTS.map((b) => [b, (data.plants as any)[b].mar_pct])) },
    { period: 'Apr 1-12', ...Object.fromEntries(PLANTS.map((b) => [b, (data.plants as any)[b].apr_pct])) },
  ]

  const utms = data.utms.filter((u: any) => u.mar > 0 || u.apr > 0)
  const drops = utms.slice().sort((a: any, b: any) => a.delta - b.delta).slice(0, 5)
  const gains = utms.slice().sort((a: any, b: any) => b.delta - a.delta).slice(0, 5)

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-purple-400" />
          <div>
            <h2 className="font-medium text-lg">April vs March — apples-to-apples (first 12 days)</h2>
            <p className="text-xs text-slate-500">Both windows are exactly 12 days, so daily-rate noise is removed. Where the change comes from (utm_content) and how quality holds up (number of plants).</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Mar 1–12</div>
          <div className="text-2xl font-semibold font-mono text-white">{mar.contacts}</div>
          <div className="text-xs text-slate-500">contacts</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Apr 1–12</div>
          <div className="text-2xl font-semibold font-mono text-white">{apr.contacts}</div>
          <div className="text-xs text-slate-500">contacts</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Δ vs Mar</div>
          <div
            className="text-2xl font-semibold font-mono"
            style={{ color: delta >= 0 ? '#34d399' : '#f87171' }}
          >
            {delta >= 0 ? <TrendingUp size={16} className="inline mr-1" /> : <TrendingDown size={16} className="inline mr-1" />}
            {delta >= 0 ? '+' : ''}{delta} ({deltaPct >= 0 ? '+' : ''}{deltaPct}%)
          </div>
          <div className="text-xs text-slate-500">growth, not drop</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">High-value (30+)</div>
          <div className="text-2xl font-semibold font-mono text-white">
            {(data.plants as any)['30-100'].apr + (data.plants as any)['More than 100'].apr}
          </div>
          <div className="text-xs text-slate-500">
            vs {(data.plants as any)['30-100'].mar + (data.plants as any)['More than 100'].mar} in Mar
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Volume comparison</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={volumeChart} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="#1e2a4f" />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid #1e2a4f' }} />
                <Bar dataKey="contacts" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Quality % by plants bucket</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={qualityChart} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="#1e2a4f" />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid #1e2a4f' }} formatter={(v: any) => `${v}%`} />
                <Legend />
                {PLANTS.map((b, i) => (
                  <Line key={b} type="monotone" dataKey={b} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto mb-4">
        <h3 className="text-sm font-medium text-slate-400 mb-2">utm_content shifts (sorted by max month)</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-700 text-xs">
              <th className="py-2 pr-3">utm_content</th>
              <th className="py-2 px-3 text-right">Mar 1–12</th>
              <th className="py-2 px-3 text-right">Apr 1–12</th>
              <th className="py-2 pl-3 text-right">Δ</th>
            </tr>
          </thead>
          <tbody>
            {utms.slice(0, 18).map((r: any) => (
              <tr key={r.utm_content} className="border-b border-slate-800">
                <td className="py-2 pr-3 font-mono text-xs" title={r.utm_content}>{shorten(r.utm_content, 55)}</td>
                <td className="py-2 px-3 text-right">{r.mar}</td>
                <td className="py-2 px-3 text-right">{r.apr}</td>
                <td
                  className="py-2 pl-3 text-right font-semibold"
                  style={{ color: r.delta > 0 ? '#34d399' : r.delta < 0 ? '#f87171' : '#94a3b8' }}
                >
                  {r.delta > 0 ? '+' : ''}{r.delta}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="font-semibold mb-2 text-xs uppercase tracking-wider text-red-300">Biggest drops Apr vs Mar</div>
          {drops.map((r: any) => (
            <div key={r.utm_content} className="text-xs mb-1">
              <span className="font-mono">{shorten(r.utm_content, 50)}</span>
              <span className="ml-2 text-red-400">{r.delta}</span>
              <span className="ml-1 text-slate-500">(Mar {r.mar} → Apr {r.apr})</span>
            </div>
          ))}
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="font-semibold mb-2 text-xs uppercase tracking-wider text-green-300">Biggest gains Apr vs Mar</div>
          {gains.map((r: any) => (
            <div key={r.utm_content} className="text-xs mb-1">
              <span className="font-mono">{shorten(r.utm_content, 50)}</span>
              <span className="ml-2 text-green-400">+{r.delta}</span>
              <span className="ml-1 text-slate-500">(Mar {r.mar} → Apr {r.apr})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm">
        <div className="font-semibold mb-2 text-slate-300">Reading this comparison</div>
        <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
          <li>
            <span className="font-semibold text-slate-300">Volume is up, not down.</span> Apples-to-apples (12 days each) shows
            <span className="text-green-400 font-semibold"> +{delta} contacts ({deltaPct >= 0 ? '+' : ''}{deltaPct}%)</span>.
            The earlier "drop" perception was a Feb→Mar story, not Mar→Apr.
          </li>
          <li>
            <span className="font-semibold text-slate-300">Tracking improved dramatically.</span> Contacts with no
            <code className="text-blue-400"> first_page_seen</code> URL fell from 104 → 5 (-99). HubSpot is capturing the URL
            for almost every new contact now (e.g., new form integration or pixel deployment).
          </li>
          <li>
            <span className="font-semibold text-slate-300">Paid ad sets drove the gain.</span> The new
            <code className="text-blue-400"> ADV[12.3.2026]</code> alone added 36 contacts (Mar 0 → Apr 36); combined with
            <code className="text-blue-400"> b2bconv[24.2.26]</code> (+14) and others, paid contributed +75 contacts.
          </li>
          <li>
            <span className="font-semibold text-slate-300">Quality held — slight shift toward "Less than 15"</span>
            (72.6% → 75.4%, +2.8pp). Could be the new ad sets pulling slightly lower-intent users, but the high-value
            buckets (30+) are stable at ~8% of total.
          </li>
        </ul>
      </div>
    </section>
  )
}

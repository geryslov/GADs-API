import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingDown, TrendingUp, Calendar } from 'lucide-react'
import mom from '../../data/mom.json'

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#f87171']
const PLANTS = ['Less than 15', '15-30', '30-100', 'More than 100']

function shorten(s: string, n = 30) {
  if (!s) return s
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export function MoMSection() {
  const months = mom.months
  const totals = mom.totals as Record<string, number>
  const days = mom.days as Record<string, number>
  const perDay = mom.perDay as Record<string, number>
  const dist = mom.plantsDistribution as Record<string, Record<string, number>>
  const distTotals = mom.plantsTotals as Record<string, number>

  const volumeChart = months.map((m) => ({
    month: m,
    total: totals[m],
    perDay: perDay[m],
    days: days[m],
  }))

  const qualityChart = months.map((m) => {
    const t = distTotals[m] || 1
    const out: any = { month: m }
    PLANTS.forEach((b) => {
      out[b] = Math.round(((dist[m][b] || 0) / t) * 1000) / 10
    })
    return out
  })

  // utm sorted by Mar count - filter top 10 + remove (no first_url) and (no utm_content) for clarity
  const topUtms = mom.utmByMonth
    .filter((u: any) => !['(no first_url)', '(no utm_content)'].includes(u.utm_content))
    .filter((u: any) => u.Feb + u.Mar + u.Apr > 0)
    .sort((a: any, b: any) => b.Mar - a.Mar)
    .slice(0, 12)

  const drops = mom.utmByMonth.slice().sort((a: any, b: any) => a.delta_MarFeb - b.delta_MarFeb).slice(0, 5)
  const gains = mom.utmByMonth.slice().sort((a: any, b: any) => b.delta_MarFeb - a.delta_MarFeb).slice(0, 5)

  const perDayMarFeb = ((perDay.Mar / perDay.Feb) - 1) * 100
  const perDayAprMar = ((perDay.Apr / perDay.Mar) - 1) * 100

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-purple-400" />
          <div>
            <h2 className="font-medium text-lg">Month-over-month — contact level</h2>
            <p className="text-xs text-slate-500">Where the drop comes from (utm_content) and how quality holds up (number of plants).</p>
          </div>
        </div>
        <div className="text-xs text-slate-500">{mom.note}</div>
      </div>

      {/* Volume KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {months.map((m) => {
          const isApr = m === 'Apr'
          return (
            <div key={m} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{m} 2026 {isApr ? '(partial)' : ''}</div>
              <div className="text-2xl font-semibold font-mono text-white">{totals[m]}</div>
              <div className="text-xs text-slate-500">{perDay[m]} / day · {days[m]}d</div>
            </div>
          )
        })}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Per-day Δ (Mar vs Feb)</div>
          <div
            className="text-2xl font-semibold font-mono"
            style={{ color: perDayMarFeb >= 0 ? '#34d399' : '#f87171' }}
          >
            {perDayMarFeb >= 0 ? <TrendingUp size={16} className="inline mr-1" /> : <TrendingDown size={16} className="inline mr-1" />}
            {perDayMarFeb.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500">Apr vs Mar: {perDayAprMar >= 0 ? '+' : ''}{perDayAprMar.toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Volume per-day */}
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Volume — total + per-day rate</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={volumeChart} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="#1e2a4f" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid #1e2a4f' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="total" name="Total contacts" fill="#60a5fa" />
                <Bar yAxisId="right" dataKey="perDay" name="Per day" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality */}
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Quality — % distribution by plants bucket (stable)</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={qualityChart} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="#1e2a4f" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
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

      {/* utm_content table */}
      <div className="overflow-x-auto mb-4">
        <h3 className="text-sm font-medium text-slate-400 mb-2">Top utm_content sources by month</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-700 text-xs">
              <th className="py-2 pr-3">utm_content</th>
              <th className="py-2 px-3 text-right">Feb</th>
              <th className="py-2 px-3 text-right">Mar</th>
              <th className="py-2 px-3 text-right">Δ Mar−Feb</th>
              <th className="py-2 pl-3 text-right">Apr (partial)</th>
            </tr>
          </thead>
          <tbody>
            {topUtms.map((r: any) => (
              <tr key={r.utm_content} className="border-b border-slate-800">
                <td className="py-2 pr-3 font-mono text-xs" title={r.utm_content}>{shorten(r.utm_content, 50)}</td>
                <td className="py-2 px-3 text-right">{r.Feb}</td>
                <td className="py-2 px-3 text-right">{r.Mar}</td>
                <td className="py-2 px-3 text-right" style={{ color: r.delta_MarFeb > 0 ? '#34d399' : r.delta_MarFeb < 0 ? '#f87171' : '#94a3b8' }}>
                  {r.delta_MarFeb > 0 ? '+' : ''}{r.delta_MarFeb}
                </td>
                <td className="py-2 pl-3 text-right">{r.Apr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="font-semibold mb-2 text-xs uppercase tracking-wider text-red-300">Biggest drops Mar vs Feb</div>
          {drops.map((r: any) => (
            <div key={r.utm_content} className="text-xs mb-1">
              <span className="font-mono">{shorten(r.utm_content, 45)}</span>
              <span className="ml-2 text-red-400">{r.delta_MarFeb}</span>
              <span className="ml-1 text-slate-500">(Feb {r.Feb} → Mar {r.Mar})</span>
            </div>
          ))}
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="font-semibold mb-2 text-xs uppercase tracking-wider text-green-300">Biggest gains Mar vs Feb</div>
          {gains.map((r: any) => (
            <div key={r.utm_content} className="text-xs mb-1">
              <span className="font-mono">{shorten(r.utm_content, 45)}</span>
              <span className="ml-2 text-green-400">+{r.delta_MarFeb}</span>
              <span className="ml-1 text-slate-500">(Feb {r.Feb} → Mar {r.Mar})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm">
        <div className="font-semibold mb-2 text-slate-300">Where the drop came from</div>
        <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
          <li>
            Per-day contact rate fell <span className="text-red-400 font-semibold">{perDayMarFeb.toFixed(1)}%</span> Feb→Mar
            ({perDay.Feb}/day → {perDay.Mar}/day). April rebounded slightly to {perDay.Apr}/day.
          </li>
          <li>
            <span className="font-semibold text-slate-300">The drop is in untracked contacts.</span> Contacts with no
            <code className="text-blue-400"> first_page_seen</code> URL fell from 355 (Feb sample) to 129 (Mar) to 5 (Apr).
            That's likely organic/email/list-imports decreasing, or HubSpot tracking improving (form-only contacts now have URLs).
          </li>
          <li>
            <span className="font-semibold text-slate-300">Paid (Meta) contacts grew.</span> The new
            <code className="text-blue-400">prospecting_web_lal-* / b2bconv-*</code> ad sets that launched in Feb-late/Mar drove
            the entire +163 gain in tracked contacts; none of these existed in Feb.
          </li>
          <li>
            <span className="font-semibold text-slate-300">Quality stayed flat.</span> "Less than 15" share is 76% / 75.5% / 75.4%
            across Feb / Mar / Apr; "30-100" and "More than 100" combined are stable at 7-8%.
            So we're acquiring fewer total contacts but the mix of buyer-intent is unchanged.
          </li>
        </ul>
      </div>
    </section>
  )
}

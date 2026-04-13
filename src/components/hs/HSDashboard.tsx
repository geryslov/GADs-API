import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Leaf, TrendingUp, Users, DollarSign, Target, AlertTriangle } from 'lucide-react'
import report from '../../data/report.json'
import meta from '../../data/meta.json'
import deals from '../../data/deals.json'
import growth from '../../data/growth.json'
import { BudgetCalculator } from './BudgetCalculator'
import { MoMSection } from './MoMSection'
import { AprVsMarSection } from './AprVsMarSection'

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#f87171', '#22d3ee']

function shorten(s: string, n = 32) {
  if (!s) return s
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

function fmt(n: number) {
  return Math.round(n).toLocaleString()
}

interface KPIProps { label: string; value: string; sub?: string; accent?: string; icon?: React.ReactNode }
function KPI({ label, value, sub, accent = 'text-blue-400', icon }: KPIProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start gap-3">
      {icon ? <div className={`mt-0.5 ${accent}`}>{icon}</div> : null}
      <div className="min-w-0">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-semibold text-white mt-0.5 font-mono">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function HSDashboard() {
  const buckets = report.plantBuckets
  const rows = report.rows

  const topChart = useMemo(
    () => rows.slice(0, 8).map((r: any) => ({
      name: shorten(r.utm_content, 22),
      full: r.utm_content,
      ...Object.fromEntries(buckets.map((b) => [b, r[b]])),
    })),
    [rows, buckets]
  )

  const pieData = useMemo(
    () => buckets.map((b) => ({ name: b, value: (report.columnTotals as any)[b] })),
    [buckets]
  )

  const totalTracked = report.grandTotal - (rows.find((r: any) => r.utm_content === '(no utm_content)')?.total || 0)
  const noUtm = rows.find((r: any) => r.utm_content === '(no utm_content)')?.total || 0
  const highValue = (report.columnTotals as any)['30-100'] + (report.columnTotals as any)['More than 100']

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-3">
          <Leaf size={20} className="text-green-400" />
          <span className="font-semibold text-slate-100">easyplant · HS Reports</span>
          <span className="text-slate-600 text-sm hidden sm:block">—</span>
          <span className="text-slate-500 text-sm hidden sm:block">Contacts with "Number of plants" — {report.period}</span>
          <span className="ml-auto text-xs text-slate-500">{report.filter}</span>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* Section 1: plants KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="Total contacts" value={String(report.grandTotal)} sub="March 2026" icon={<Users size={18} />} accent="text-blue-400" />
          <KPI label="Tracked (utm)" value={String(totalTracked)} sub={`${Math.round((totalTracked / report.grandTotal) * 100)}% of total`} icon={<Target size={18} />} accent="text-green-400" />
          <KPI label="No utm_content" value={String(noUtm)} sub={`${Math.round((noUtm / report.grandTotal) * 100)}% of total`} icon={<AlertTriangle size={18} />} accent="text-yellow-400" />
          <KPI label="High-value 30+" value={String(highValue)} sub={`${(report.columnTotals as any)['More than 100']} in 100+`} icon={<TrendingUp size={18} />} accent="text-purple-400" />
        </section>

        {/* Section 2: charts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:col-span-2">
            <h2 className="font-medium mb-2">Top 8 campaigns — stacked by plants bucket</h2>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <BarChart data={topChart} margin={{ top: 8, right: 16, left: 8, bottom: 70 }}>
                  <CartesianGrid stroke="#1e2a4f" />
                  <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#0b1020', border: '1px solid #1e2a4f' }}
                    labelFormatter={(_l, payload: any) => payload?.[0]?.payload?.full || ''}
                  />
                  <Legend />
                  {buckets.map((b, i) => (
                    <Bar key={b} dataKey={b} stackId="a" fill={COLORS[i % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="font-medium mb-2">Contacts by Number of plants</h2>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid #1e2a4f' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Section 3: utm x plants pivot */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto">
          <h2 className="font-medium mb-3">Pivot — utm_content × Number of plants</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="py-2 pr-3">utm_content</th>
                {buckets.map((b) => (
                  <th key={b} className="py-2 px-3 text-right">{b}</th>
                ))}
                <th className="py-2 pl-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.utm_content} className="border-b border-slate-800 hover:bg-slate-800/60">
                  <td className="py-2 pr-3 font-mono text-xs" title={r.utm_content}>{shorten(r.utm_content, 55)}</td>
                  {buckets.map((b) => (
                    <td key={b} className="py-2 px-3 text-right">
                      {r[b]} <span className="text-slate-500 text-xs">({r[`${b} %`]}%)</span>
                    </td>
                  ))}
                  <td className="py-2 pl-3 text-right font-semibold">
                    {r.total} <span className="text-slate-500 text-xs">({r.totalPct}%)</span>
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-2 pr-3">TOTAL</td>
                {buckets.map((b) => (
                  <td key={b} className="py-2 px-3 text-right">
                    {(report.columnTotals as any)[b]} <span className="text-slate-500 text-xs">(100%)</span>
                  </td>
                ))}
                <td className="py-2 pl-3 text-right">{report.grandTotal} <span className="text-slate-500 text-xs">(100%)</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 4: Meta × HS leads */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
            <div>
              <h2 className="font-medium">Meta × HubSpot leads</h2>
              <p className="text-xs text-slate-500">Meta {meta.metaPeriod} · HS {meta.hsPeriod} · Total spend ${fmt(meta.totalMetaSpend)} · {meta.totalHsLeadsMatched} of {meta.totalHsLeadsAll} leads matched</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 340 }} className="mb-3">
            <ResponsiveContainer>
              <BarChart
                data={meta.joined.filter((r: any) => r.spend > 0 || r.hs_leads_march > 0).slice(0, 12).map((r: any) => ({
                  name: shorten(r.ad_set, 22),
                  full: r.ad_set,
                  spend: r.spend,
                  leads: r.hs_leads_march,
                }))}
                margin={{ top: 8, right: 16, left: 8, bottom: 80 }}
              >
                <CartesianGrid stroke="#1e2a4f" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} stroke="#94a3b8" fontSize={10} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#0b1020', border: '1px solid #1e2a4f' }}
                  labelFormatter={(_l, payload: any) => payload?.[0]?.payload?.full || ''}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="spend" name="Spend (USD)" fill="#60a5fa" />
                <Bar yAxisId="right" dataKey="leads" name="HS leads (March)" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Section 5: Deals */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
            <div>
              <h2 className="font-medium">Deals analysis — March 2026</h2>
              <p className="text-xs text-slate-500">Excludes <em>Form Submitted</em> and <em>Disqualified</em></p>
            </div>
            <div className="text-xs text-slate-500">{deals.totalDeals} deals · ${fmt(deals.totalPipeline)} pipeline</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <KPI label="Total deals" value={String(deals.totalDeals)} sub={`$${fmt(deals.totalPipeline)} pipeline`} icon={<TrendingUp size={18} />} />
            <KPI label="Closed Won" value={String(deals.closedWonCount)} sub={`$${fmt(deals.closedWonAmount)} revenue`} icon={<DollarSign size={18} />} accent="text-green-400" />
            <KPI label="Avg won deal" value={`$${fmt(deals.avgWonDeal)}`} sub={`${Math.round((deals.closedWonCount / deals.totalDeals) * 1000) / 10}% win rate`} icon={<Target size={18} />} accent="text-purple-400" />
            <KPI label="Meta-attributed" value={String(deals.matchedDealContacts)} sub={`of ${deals.totalDeals} deals`} icon={<Users size={18} />} accent="text-orange-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-slate-400">Stage breakdown</h3>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-700">
                    <th className="py-2 pr-3">Stage</th>
                    <th className="py-2 px-3 text-right">Count</th>
                    <th className="py-2 pl-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(deals.stageCounts).sort((a, b) => Number(b[1]) - Number(a[1])).map(([k, v]) => (
                    <tr key={k} className="border-b border-slate-800">
                      <td className="py-2 pr-3">{k}</td>
                      <td className="py-2 px-3 text-right">{v as number}</td>
                      <td className="py-2 pl-3 text-right">${fmt((deals.stageAmounts as any)[k] || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-slate-400">Deal-contacts by ad set</h3>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-700">
                    <th className="py-2 pr-3">Ad set</th>
                    <th className="py-2 px-3 text-right">Spend</th>
                    <th className="py-2 px-3 text-right">Deals</th>
                    <th className="py-2 pl-3 text-right">Cost/Deal</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.adSets.filter((a: any) => a.spend > 0 || a.deal_contacts > 0).map((a: any) => (
                    <tr key={a.ad_set} className="border-b border-slate-800">
                      <td className="py-2 pr-3 font-mono text-xs" title={a.ad_set}>{shorten(a.ad_set, 32)}</td>
                      <td className="py-2 px-3 text-right">${fmt(a.spend)}</td>
                      <td className="py-2 px-3 text-right">{a.deal_contacts}</td>
                      <td className="py-2 pl-3 text-right">{a.cost_per_deal != null ? `$${Math.round(a.cost_per_deal)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 6: Growth scenarios */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
            <div>
              <h2 className="font-medium">Growth scenarios</h2>
              <p className="text-xs text-slate-500">Break-even CPD ${growth.baseline.break_even_cpd} · Target (2× ROAS) ${growth.baseline.target_2x_roas_cpd}</p>
            </div>
            <div className="text-xs text-slate-500">Fatigue: {growth.fatigue_model}</div>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-700">
                <th className="py-2 pr-3">Scenario</th>
                <th className="py-2 px-3 text-right">Spend</th>
                <th className="py-2 px-3 text-right">Contacts</th>
                <th className="py-2 px-3 text-right">Wins</th>
                <th className="py-2 px-3 text-right">Revenue</th>
                <th className="py-2 pl-3 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {growth.scenarios.map((s: any) => (
                <tr key={s.label} className="border-b border-slate-800">
                  <td className="py-2 pr-3 font-semibold">{s.label}</td>
                  <td className="py-2 px-3 text-right">${fmt(s.spend)}</td>
                  <td className="py-2 px-3 text-right">{fmt(s.deal_contacts)}</td>
                  <td className="py-2 px-3 text-right">{s.expected_wins_first_purchase}</td>
                  <td className="py-2 px-3 text-right">${fmt(s.expected_revenue_first_purchase)}</td>
                  <td
                    className="py-2 pl-3 text-right font-semibold"
                    style={{ color: s.roas_first_purchase >= 1.2 ? '#34d399' : s.roas_first_purchase >= 1.0 ? '#fbbf24' : '#f87171' }}
                  >
                    {s.roas_first_purchase}×
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 text-xs">
            {(Object.entries(growth.tiers) as [string, any[]][]).map(([tier, items]) => (
              <div key={tier} className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <div className="font-semibold mb-2 uppercase tracking-wider text-slate-300">{tier.replace('_', ' ')}</div>
                {items.length === 0 ? (
                  <div className="text-slate-500">—</div>
                ) : (
                  items.map((i: any) => (
                    <div key={i.ad_set} className="mb-2">
                      <div className="font-mono text-[10px] truncate" title={i.ad_set}>{i.ad_set}</div>
                      <div className="text-slate-500">${fmt(i.spend)} · CPD {i.cpd ? `$${Math.round(i.cpd)}` : '—'} · ROAS {i.roas}×</div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 7a: April vs March (apples-to-apples) */}
        <AprVsMarSection />

        {/* Section 7b: Feb/Mar/Apr trend */}
        <MoMSection />

        {/* Section 8: Calculator */}
        <BudgetCalculator />

        <footer className="text-xs text-slate-600 text-center py-6">
          easyplant · HS Reports · data from HubSpot MCP + Meta ad-sets export
        </footer>
      </div>
    </div>
  )
}

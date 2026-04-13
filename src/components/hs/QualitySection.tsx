import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts'
import { DollarSign, TrendingUp, Target, Gem } from 'lucide-react'
import data from '../../data/quality.json'

const money = (n: number) => `$${Math.round(n).toLocaleString()}`

function KPI({ label, value, sub, accent = 'text-blue-400', icon }: { label: string; value: string; sub?: string; accent?: string; icon?: React.ReactNode }) {
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

export function QualitySection() {
  const plants = data.plants_quality
  const projects = data.project_type_quality

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Gem size={20} className="text-cyan-400" />
          <div>
            <h2 className="font-medium text-lg">Quality metrics — deal size + Expected Value per lead</h2>
            <p className="text-xs text-slate-500">
              Analyzed {data.cw_sample_size} of {data.cw_total_ytd} YTD Closed Won deals with amount, project_type, and plants.
              Goal: identify which lead segments drive revenue, not just count conversions.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KPI label="Avg Won deal" value={money(data.overall.mean_won)} sub={`Median ${money(data.overall.median_won)}`} icon={<DollarSign size={18} />} accent="text-green-400" />
        <KPI label="Max Won deal" value={money(data.overall.max_won)} sub="More than 100 plants · Gifting" icon={<TrendingUp size={18} />} accent="text-purple-400" />
        <KPI label="Revenue spread" value="9×" sub="$961 (< 15) → $8,543 (100+)" icon={<Gem size={18} />} accent="text-cyan-400" />
        <KPI label="EV spread per lead" value="14×" sub="$90 → $1,200" icon={<Target size={18} />} accent="text-yellow-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Plants bucket — avg deal size and Expected Value per lead</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={plants} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="#1e2a4f" />
                <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={11} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid #1e2a4f' }}
                  formatter={(v: any, name: string) => {
                    if (name.includes('Win rate')) return [`${v}%`, name]
                    return [`$${Number(v).toLocaleString()}`, name]
                  }} />
                <Legend />
                <Bar yAxisId="left" dataKey="avg_won_amount" name="Avg Won $" fill="#34d399" />
                <Bar yAxisId="left" dataKey="expected_value_per_lead" name="EV / lead $" fill="#fbbf24" />
                <Line yAxisId="right" dataKey="win_rate_pct" name="Win rate %" stroke="#60a5fa" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="overflow-x-auto">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Plants quality table</h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-700 text-xs">
                <th className="py-2 pr-3">Bucket</th>
                <th className="py-2 px-3 text-right">Leads</th>
                <th className="py-2 px-3 text-right">Wins</th>
                <th className="py-2 px-3 text-right">Win %</th>
                <th className="py-2 px-3 text-right">Avg $</th>
                <th className="py-2 pl-3 text-right">EV/Lead</th>
              </tr>
            </thead>
            <tbody>
              {plants.map((r: any) => (
                <tr key={r.bucket} className="border-b border-slate-800">
                  <td className="py-2 pr-3">{r.bucket}</td>
                  <td className="py-2 px-3 text-right">{r.leads_ytd.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">{r.estimated_wins}</td>
                  <td className="py-2 px-3 text-right">{r.win_rate_pct}%</td>
                  <td className="py-2 px-3 text-right">{money(r.avg_won_amount)}</td>
                  <td className="py-2 pl-3 text-right font-semibold text-green-400">{money(r.expected_value_per_lead)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-500 mt-2">
            EV/Lead = win rate × avg won amount. A "30-100" lead is worth 9× a "Less than 15" lead in expected revenue, even though the win rate gap is only 2.6×.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto mb-4">
        <h3 className="text-sm font-medium text-slate-400 mb-2">Project type — avg won deal size (what to sell to)</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-700 text-xs">
              <th className="py-2 pr-3">Project type</th>
              <th className="py-2 px-3 text-right">CW count (sample)</th>
              <th className="py-2 px-3 text-right">% of wins</th>
              <th className="py-2 px-3 text-right">Mean deal</th>
              <th className="py-2 pl-3 text-right">Median deal</th>
            </tr>
          </thead>
          <tbody>
            {projects.sort((a: any, b: any) => b.mean_amount - a.mean_amount).map((r: any) => (
              <tr key={r.project_type} className="border-b border-slate-800">
                <td className="py-2 pr-3">{r.project_type}</td>
                <td className="py-2 px-3 text-right">{r.cw_count_sample}</td>
                <td className="py-2 px-3 text-right">{r.cw_share_pct}%</td>
                <td className="py-2 px-3 text-right font-semibold" style={{ color: r.mean_amount >= 1700 ? '#34d399' : r.mean_amount >= 1200 ? '#fbbf24' : r.mean_amount >= 700 ? '#94a3b8' : '#f87171' }}>
                  {money(r.mean_amount)}
                </td>
                <td className="py-2 pl-3 text-right">{money(r.median_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm">
        <div className="font-semibold mb-2 text-slate-300">Key insights — quality over quantity</div>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-xs">
          {data.key_insights.map((c: string, i: number) => (
            <li key={i}>{c}</li>
          ))}
        </ol>
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-sm mt-4">
        <div className="font-semibold mb-2 text-slate-300">How to use this</div>
        <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
          <li><span className="text-slate-300 font-semibold">Lead scoring</span>: blend plants bucket EV with project_type avg. A "30-100 / Office Design" lead scores ~$1,300 EV; a "Less than 15 / Designers" scores ~$50. SDR queue should sort by this.</li>
          <li><span className="text-slate-300 font-semibold">Paid bidding</span>: at current Meta CPD $78-240, only leads with EV {'>'} $250 are profitable. That's only 15-30+ buckets. Meta algorithm should optimize toward a "high-value lead" event, not any form submit.</li>
          <li><span className="text-slate-300 font-semibold">Landing-page routing</span>: if the prospect answers "30-100" or "More than 100", immediately push them to a calendar booking (high EV justifies high-touch). "Less than 15" goes to self-serve.</li>
          <li><span className="text-slate-300 font-semibold">Sales cadence</span>: Designers-for-Clients deals avg $531 — scripted email nurture only, no SDR calls. Office Design ($1,613) + Gifting ($1,652) get full cadence. Stores/Restaurants/Hospitality get dedicated AE.</li>
        </ul>
      </div>
    </section>
  )
}

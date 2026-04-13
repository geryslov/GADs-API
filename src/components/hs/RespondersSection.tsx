import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Users, TrendingUp, Award, Globe, Briefcase } from 'lucide-react'
import data from '../../data/responders.json'

const COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f472b6', '#a78bfa', '#f87171']

export function RespondersSection() {
  const km = data.key_metrics

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-green-400" />
          <div>
            <h2 className="font-medium text-lg">Responsive contacts — common patterns</h2>
            <p className="text-xs text-slate-500">
              Who responds (answered a call or replied to a sales email) and what sets them apart from the baseline?
              Sample: {data.sample_analyzed} of ~{data.total_responders_estimated} email responders; {data.call_answered_total} call answerers;
              {' '}{data.email_replied_also_call_answered} engaged on both channels.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1"><Award size={10} /> Customer rate</div>
          <div className="text-2xl font-semibold font-mono text-green-400">{km.customer_rate_responders_pct}%</div>
          <div className="text-xs text-slate-500">vs {km.customer_rate_baseline_pct}% baseline · <span className="text-green-400">{km.customer_rate_multiplier}×</span></div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1"><TrendingUp size={10} /> Responder cohort</div>
          <div className="text-2xl font-semibold font-mono text-white">~{data.total_responders_estimated}</div>
          <div className="text-xs text-slate-500">email repliers + 158 call answerers</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">% with phone</div>
          <div className="text-2xl font-semibold font-mono text-white">{km.with_phone_responders_pct}%</div>
          <div className="text-xs text-slate-500">baseline {km.with_phone_baseline_pct}% — no lift</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Dual-channel engaged</div>
          <div className="text-2xl font-semibold font-mono text-white">{data.email_replied_also_call_answered}</div>
          <div className="text-xs text-slate-500">both replied email + answered call</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Plants bucket — responders vs baseline (% lift)</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data.plants_comparison} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="#1e2a4f" />
                <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid #1e2a4f' }} formatter={(v: any) => `${v}%`} />
                <Legend />
                <Bar dataKey="responders_pct" name="Responders %" fill="#34d399" />
                <Bar dataKey="baseline_pct" name="Baseline %" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2">Higher plants buckets (15+) are over-indexed among responders — bigger buyers engage more.</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-1"><Briefcase size={14} /> Original traffic source</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data.sources} layout="vertical" margin={{ top: 8, right: 16, left: 80, bottom: 8 }}>
                <CartesianGrid stroke="#1e2a4f" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} unit="%" />
                <YAxis dataKey="source" type="category" stroke="#94a3b8" fontSize={10} width={110} />
                <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid #1e2a4f' }} formatter={(v: any, _n, p: any) => [`${v}% (${p.payload.count})`, 'Share']} />
                <Bar dataKey="pct" fill="#60a5fa" >
                  {data.sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2">60% came in through OFFLINE (booked meetings/Calendly). Direct + organic make up another ~17%.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1 text-slate-300"><Users size={12} /> Lifecycle stage</h3>
          <table className="min-w-full text-xs">
            <tbody>
              {data.lifecycle.map((r: any) => (
                <tr key={r.stage} className="border-b border-slate-700/30">
                  <td className="py-1.5 pr-3 capitalize">{r.stage}</td>
                  <td className="py-1.5 px-2 text-right font-mono">{r.count}</td>
                  <td className="py-1.5 pl-2 text-right text-slate-500">{r.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1 text-slate-300"><Globe size={12} /> Top US states</h3>
          <table className="min-w-full text-xs">
            <tbody>
              {data.top_states.map((r: any) => (
                <tr key={r.state} className="border-b border-slate-700/30">
                  <td className="py-1.5 pr-3">{r.state}</td>
                  <td className="py-1.5 pl-2 text-right font-mono">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1 text-slate-300"><Briefcase size={12} /> Job role keywords</h3>
          <table className="min-w-full text-xs">
            <tbody>
              {data.job_role_keywords.map((r: any) => (
                <tr key={r.keyword} className="border-b border-slate-700/30">
                  <td className="py-1.5 pr-3 capitalize">{r.keyword}</td>
                  <td className="py-1.5 px-2 text-right font-mono">{r.count}</td>
                  <td className="py-1.5 pl-2 text-right text-slate-500">{r.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm">
        <div className="font-semibold mb-2 text-slate-300">Conclusions — profile of the responsive buyer</div>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-xs">
          {data.conclusions.map((c: string, i: number) => (
            <li key={i}>{c}</li>
          ))}
        </ol>
      </div>
    </section>
  )
}

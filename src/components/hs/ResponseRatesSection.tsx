import { Phone, PhoneOff, Mail, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import data from '../../data/response_rates.json'

function Card({ label, value, sub, icon, accent }: { label: string; value: string; sub?: string; icon?: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start gap-3">
      {icon ? <div className={`mt-0.5 ${accent || 'text-blue-400'}`}>{icon}</div> : null}
      <div className="min-w-0">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-semibold text-white mt-0.5 font-mono">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function ResponseRatesSection() {
  const hp = data.segments.has_phone
  const np = data.segments.no_phone
  const emailHp = data.email_replies.has_phone
  const emailNp = data.email_replies.no_phone
  const callHp = data.answered_call_contacts.has_phone
  const callNp = data.answered_call_contacts.no_phone
  const calls = data.calls

  const chartData = [
    {
      segment: `Has phone (${hp.n.toLocaleString()})`,
      'Email reply rate': emailHp.rate_pct,
      'Call-answered rate': callHp.rate_pct,
    },
    {
      segment: `No phone (${np.n.toLocaleString()})`,
      'Email reply rate': emailNp.rate_pct,
      'Call-answered rate': callNp.rate_pct,
    },
  ]

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Phone size={20} className="text-cyan-400" />
          <div>
            <h2 className="font-medium text-lg">Response rates YTD — with phone vs without</h2>
            <p className="text-xs text-slate-500">{data.filter} · {data.period}. Based on sales email replies (<code>hs_sales_email_last_replied</code>) and calls with disposition Connected/Meeting&nbsp;scheduled/Left&nbsp;live&nbsp;message.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card label="Total YTD contacts" value={data.segments.total.n.toLocaleString()} sub="plants known" icon={<TrendingUp size={18} />} />
        <Card label="With phone" value={hp.n.toLocaleString()} sub={`${hp.pct_of_total}% of total`} icon={<Phone size={18} />} accent="text-green-400" />
        <Card label="Without phone" value={np.n.toLocaleString()} sub={`${np.pct_of_total}% of total`} icon={<PhoneOff size={18} />} accent="text-orange-400" />
        <Card label="YTD calls attempted" value={calls.total_attempted_ytd.toLocaleString()} sub={`${calls.total_answered_ytd} answered · ${calls.call_answer_rate_pct}% call-level`} icon={<Phone size={18} />} accent="text-cyan-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Phone size={16} className="text-green-400" />
            <h3 className="font-semibold text-slate-300">With phone number ({hp.n.toLocaleString()})</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1"><Mail size={10} /> Email replies</div>
              <div className="text-3xl font-semibold font-mono text-white">{emailHp.rate_pct}%</div>
              <div className="text-xs text-slate-500">{emailHp.replied} of {emailHp.total}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1"><Phone size={10} /> Call answered</div>
              <div className="text-3xl font-semibold font-mono text-white">{callHp.rate_pct}%</div>
              <div className="text-xs text-slate-500">{callHp.contacts_with_answered_call} of {callHp.total}</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <PhoneOff size={16} className="text-orange-400" />
            <h3 className="font-semibold text-slate-300">Without phone number ({np.n.toLocaleString()})</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1"><Mail size={10} /> Email replies</div>
              <div className="text-3xl font-semibold font-mono text-white">{emailNp.rate_pct}%</div>
              <div className="text-xs text-slate-500">{emailNp.replied} of {emailNp.total}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1"><Phone size={10} /> Call answered</div>
              <div className="text-3xl font-semibold font-mono text-white">{callNp.rate_pct}%</div>
              <div className="text-xs text-slate-500">{callNp.contacts_with_answered_call} of {callNp.total} · cannot call without a number</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-medium text-slate-400 mb-2">Response rates by segment</h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid stroke="#1e2a4f" />
              <XAxis dataKey="segment" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
              <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid #1e2a4f' }} formatter={(v: any) => `${v}%`} />
              <Legend />
              <Bar dataKey="Email reply rate" fill="#60a5fa" />
              <Bar dataKey="Call-answered rate" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm">
        <div className="font-semibold mb-2 text-slate-300">Takeaways</div>
        <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
          <li>
            Phone-having contacts reply to sales emails at <span className="text-green-400 font-semibold">{emailHp.rate_pct}%</span> —
            <span className="text-green-400 font-semibold"> 1.5×</span> the rate of those without a phone (<span className="text-slate-300">{emailNp.rate_pct}%</span>).
            Likely because the with-phone cohort self-selected through higher-intent forms (Meet / B2B form with phone field).
          </li>
          <li>
            <span className="text-green-400 font-semibold">{callHp.rate_pct}%</span> of phone-having contacts had at least one answered call (Connected, Meeting scheduled, or Live message).
            Call-level answer rate on the sales-ops side was <span className="font-semibold">{calls.call_answer_rate_pct}%</span> across {calls.total_attempted_ytd.toLocaleString()} attempts.
          </li>
          <li>
            <span className="text-orange-400 font-semibold">0</span> contacts without a phone received an answered call — they're email-only by definition.
          </li>
          <li>
            Implication: asking for phone on the form is a meaningful qualifier. The no-phone cohort still replies via email at {emailNp.rate_pct}%, so don't drop them — but don't spend call effort there.
          </li>
        </ul>
      </div>
    </section>
  )
}

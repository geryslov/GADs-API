import { useMemo, useState } from 'react'
import { Calculator, Zap } from 'lucide-react'
import growth from '../../data/growth.json'
import deals from '../../data/deals.json'

const baseline = growth.baseline
const adSets = deals.adSets.filter((a: any) => a.spend > 0 && a.cost_per_deal != null)
const baseSpend = baseline.total_spend
const winRate = baseline.win_rate_pct / 100
const avgWon = baseline.avg_won_deal
const breakEvenCpd = baseline.break_even_cpd

const cplMult = (x: number) => 1 + 0.25 * (x - 1) + 0.05 * Math.pow(x - 1, 2)
const money = (n: number) => `$${Math.round(n).toLocaleString()}`
const fmt = (n: number, d = 0) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d)

type Mode = 'smart' | 'naive'

export function BudgetCalculator() {
  const [budget, setBudget] = useState(Math.round(baseSpend * 1.6))
  const [mode, setMode] = useState<Mode>('smart')

  const result = useMemo(() => {
    const mult = budget / baseSpend
    if (mode === 'naive') {
      const effCpd = baseline.blended_cpd * cplMult(mult)
      const contacts = effCpd > 0 ? budget / effCpd : 0
      const wins = contacts * winRate
      const revenue = wins * avgWon
      return {
        mode: 'naive', mult, spend: budget, effCpd, contacts, wins, revenue,
        roas: budget > 0 ? revenue / budget : 0,
        perSet: [] as any[],
      }
    }
    const perSet = adSets.map((a: any) => {
      const cpd = a.cost_per_deal
      if (cpd >= breakEvenCpd) {
        return { ad_set: a.ad_set, action: 'cut', new_spend: 0, new_cpd: cpd, new_contacts: 0 }
      }
      let asMult: number
      if (cpd < 100) asMult = mult * 1.2
      else if (cpd < 140) asMult = mult * 1.0
      else asMult = mult * 0.5
      const newCpd = cpd * cplMult(asMult)
      const newSpend = a.spend * asMult
      const newContacts = newCpd > 0 ? newSpend / newCpd : 0
      return {
        ad_set: a.ad_set,
        action: cpd < 100 ? 'scale hard' : cpd < 140 ? 'scale moderate' : 'hold',
        new_spend: newSpend, new_cpd: newCpd, new_contacts: newContacts,
      }
    })
    const rawSpend = perSet.reduce((s, x) => s + x.new_spend, 0)
    const scale = rawSpend > 0 ? budget / rawSpend : 1
    perSet.forEach((x) => { x.new_spend *= scale; x.new_contacts *= scale })
    const contacts = perSet.reduce((s, x) => s + x.new_contacts, 0)
    const wins = contacts * winRate
    const revenue = wins * avgWon
    const blendedCpd = contacts > 0 ? budget / contacts : 0
    return {
      mode: 'smart', mult, spend: budget, effCpd: blendedCpd, contacts, wins, revenue,
      roas: budget > 0 ? revenue / budget : 0,
      perSet,
    }
  }, [budget, mode])

  const quickBtns = [0.5, 1, 1.5, 2, 2.5, 3].map((m) => Math.round(baseSpend * m))
  const roasColor = result.roas >= 1.2 ? '#34d399' : result.roas >= 1.0 ? '#fbbf24' : '#f87171'

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Calculator size={20} className="text-blue-400" />
          <div>
            <h2 className="font-medium text-lg">Budget calculator</h2>
            <p className="text-xs text-slate-500">Type a monthly Meta budget and see predicted deals, revenue and ROAS with fatigue-adjusted CPD.</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setMode('smart')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${mode === 'smart' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Zap size={12} /> Smart reallocation
          </button>
          <button
            onClick={() => setMode('naive')}
            className={`px-3 py-1.5 rounded-md transition-colors ${mode === 'naive' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Naive blended
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Monthly budget (USD)</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">$</span>
            <input
              type="number" min={0} step={500} value={budget}
              onChange={(e) => setBudget(Math.max(0, parseInt(e.target.value) || 0))}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-xl font-semibold text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <input
            type="range" min={0} max={baseSpend * 5} step={500}
            value={Math.min(budget, baseSpend * 5)}
            onChange={(e) => setBudget(parseInt(e.target.value))}
            className="w-full mt-3 accent-blue-500"
          />
          <div className="flex gap-1 mt-2 flex-wrap">
            {quickBtns.map((b, i) => (
              <button
                key={i}
                onClick={() => setBudget(b)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  budget === b ? 'border-blue-500 bg-blue-600/20 text-blue-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {[0.5, 1, 1.5, 2, 2.5, 3][i]}× <span className="text-slate-500">(${b.toLocaleString()})</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Multiplier</div>
            <div className="text-xl font-semibold font-mono">{fmt(result.mult, 2)}×</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Blended CPD</div>
            <div className="text-xl font-semibold font-mono">{money(result.effCpd)}</div>
            <div className="text-[10px] text-slate-500">break-even ${breakEvenCpd}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Deal-contacts</div>
          <div className="text-2xl font-semibold font-mono text-white">{fmt(result.contacts, 0)}</div>
          <div className="text-xs text-slate-500">vs {baseline.matched_deal_contacts} baseline</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Expected wins</div>
          <div className="text-2xl font-semibold font-mono text-white">{fmt(result.wins, 1)}</div>
          <div className="text-xs text-slate-500">@ {baseline.win_rate_pct}% win rate</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Revenue (1st purchase)</div>
          <div className="text-2xl font-semibold font-mono text-white">{money(result.revenue)}</div>
          <div className="text-xs text-slate-500">@ ${Math.round(avgWon).toLocaleString()} avg</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">ROAS</div>
          <div className="text-2xl font-semibold font-mono" style={{ color: roasColor }}>{fmt(result.roas, 2)}×</div>
          <div className="text-xs text-slate-500">first purchase only</div>
        </div>
      </div>

      {result.mode === 'smart' && result.perSet.length > 0 ? (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-slate-400 hover:text-slate-200">Per-ad-set allocation at this budget</summary>
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-slate-500 text-xs border-b border-slate-700">
                  <th className="py-2 pr-3">Ad set</th>
                  <th className="py-2 px-3 text-right">Action</th>
                  <th className="py-2 px-3 text-right">Spend</th>
                  <th className="py-2 px-3 text-right">Projected CPD</th>
                  <th className="py-2 pl-3 text-right">Deal-contacts</th>
                </tr>
              </thead>
              <tbody>
                {result.perSet.slice().sort((a: any, b: any) => b.new_spend - a.new_spend).map((r: any) => (
                  <tr key={r.ad_set} className="border-b border-slate-800 text-xs">
                    <td className="py-2 pr-3 font-mono" title={r.ad_set}>{r.ad_set.length > 50 ? r.ad_set.slice(0, 49) + '…' : r.ad_set}</td>
                    <td className="py-2 px-3 text-right" style={{ color: r.action === 'cut' ? '#f87171' : r.action === 'scale hard' ? '#34d399' : r.action === 'scale moderate' ? '#fbbf24' : '#94a3b8' }}>{r.action}</td>
                    <td className="py-2 px-3 text-right">{money(r.new_spend)}</td>
                    <td className="py-2 px-3 text-right">${Math.round(r.new_cpd)}</td>
                    <td className="py-2 pl-3 text-right">{fmt(r.new_contacts, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}

      <p className="mt-4 text-xs text-slate-500">
        <span className="font-semibold text-slate-400">Formula:</span> CPL multiplier = 1 + 0.25·(x−1) + 0.05·(x−1)² where x = budget / ${baseSpend.toLocaleString()}.
        <span className="font-semibold text-slate-400 ml-2">Smart mode</span> cuts ad sets with CPD ≥ break-even (${breakEvenCpd}); scales top performers (CPD &lt; $100) at 1.2× the multiplier, moderate at 1.0×, hold tier at 0.5×.
      </p>
    </section>
  )
}

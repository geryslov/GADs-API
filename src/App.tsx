import { useEffect, useState } from 'react'
import { BarChart2, Search, Loader2, RefreshCw, ChevronDown } from 'lucide-react'
import { useAccounts, useAccountOverview, useSearchTerms, useNLQuery } from './hooks/useGoogleAds'
import { KPICards } from './components/KPICards'
import { CampaignTable } from './components/CampaignTable'
import { SearchTermsTable } from './components/SearchTermsTable'
import { AIQueryPanel } from './components/AIQueryPanel'
import type { Account } from './types'

type Tab = 'campaigns' | 'search-terms'
type Days = 7 | 14 | 30

export default function App() {
  const { accounts, loading: loadingAccounts, load: loadAccounts } = useAccounts()
  const { overview, loading: loadingOverview, load: loadOverview } = useAccountOverview()
  const { terms, loading: loadingTerms, load: loadTerms } = useSearchTerms()
  const { result, loading: loadingQuery, error: queryError, query, reset } = useNLQuery()

  const [selected, setSelected] = useState<Account | null>(null)
  const [tab, setTab] = useState<Tab>('campaigns')
  const [days, setDays] = useState<Days>(30)
  const [termDays, setTermDays] = useState<Days>(7)

  // Load accounts on mount
  useEffect(() => { loadAccounts() }, [loadAccounts])

  // Load data when account or date range changes
  useEffect(() => {
    if (selected) {
      loadOverview(selected.id, days)
    }
  }, [selected, days, loadOverview])

  useEffect(() => {
    if (selected && tab === 'search-terms') {
      loadTerms(selected.id, termDays)
    }
  }, [selected, tab, termDays, loadTerms])

  const handleSelectAccount = (acc: Account) => {
    setSelected(acc)
    reset()
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-3">
          <BarChart2 size={20} className="text-blue-400" />
          <span className="font-semibold text-slate-100">Google Ads MCC</span>
          <span className="text-slate-600 text-sm hidden sm:block">—</span>
          <span className="text-slate-500 text-sm hidden sm:block">Performance Dashboard</span>
          {loadingAccounts && (
            <Loader2 size={14} className="ml-auto animate-spin text-slate-500" />
          )}
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto w-full px-4 py-4 flex gap-4 flex-1 min-h-0">
        {/* Sidebar — Account List */}
        <aside className="w-56 flex-shrink-0">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden sticky top-16">
            <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Accounts</span>
              <button
                onClick={loadAccounts}
                className="text-slate-600 hover:text-slate-400 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={12} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-120px)]">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => handleSelectAccount(acc)}
                  className={`w-full text-left px-3 py-2.5 text-sm border-b border-slate-800/50 transition-colors hover:bg-slate-800 cursor-pointer ${
                    selected?.id === acc.id ? 'bg-blue-900/30 text-blue-300 border-l-2 border-l-blue-500' : 'text-slate-300'
                  }`}
                >
                  <span className="block truncate">{acc.name}</span>
                  <span className="text-xs text-slate-600 font-mono">{acc.id}</span>
                </button>
              ))}
              {!loadingAccounts && accounts.length === 0 && (
                <p className="text-slate-600 text-xs px-3 py-4">No accounts found</p>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 space-y-4">
          {!selected ? (
            <div className="flex items-center justify-center h-64 text-slate-600">
              <div className="text-center">
                <Search size={32} className="mx-auto mb-2 opacity-30" />
                <p>Select an account to get started</p>
              </div>
            </div>
          ) : (
            <>
              {/* Account header + date range */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-lg font-semibold text-slate-100">{selected.name}</h1>
                  <p className="text-xs text-slate-500 font-mono">{selected.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Date range:</span>
                  <div className="relative">
                    <select
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value) as Days)}
                      className="appearance-none bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-7 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value={7}>Last 7 days</option>
                      <option value={14}>Last 14 days</option>
                      <option value={30}>Last 30 days</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              {loadingOverview ? (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4 h-20 animate-pulse" />
                  ))}
                </div>
              ) : overview ? (
                <KPICards kpi={overview.kpi} />
              ) : null}

              {/* Main split: left = tabs, right = AI panel */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4 items-start">
                {/* Tabs panel */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1 border-b border-slate-800">
                    {(['campaigns', 'search-terms'] as Tab[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${
                          tab === t
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {t.replace('-', ' ')}
                      </button>
                    ))}

                    {tab === 'search-terms' && (
                      <div className="ml-auto flex items-center gap-2 pb-1">
                        <span className="text-xs text-slate-500">Last:</span>
                        {([7, 14, 30] as Days[]).map((d) => (
                          <button
                            key={d}
                            onClick={() => setTermDays(d)}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              termDays === d ? 'bg-blue-600/30 text-blue-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {d}d
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {tab === 'campaigns' && (
                    <>
                      {loadingOverview ? (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl h-64 animate-pulse" />
                      ) : overview ? (
                        <CampaignTable campaigns={overview.campaigns} />
                      ) : null}
                    </>
                  )}

                  {tab === 'search-terms' && (
                    <>
                      {loadingTerms ? (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl h-64 animate-pulse" />
                      ) : (
                        <SearchTermsTable terms={terms} />
                      )}
                    </>
                  )}
                </div>

                {/* AI Query Panel */}
                <div className="xl:sticky xl:top-16">
                  <AIQueryPanel
                    accountId={selected.id}
                    accountName={selected.name}
                    onQuery={query}
                    loading={loadingQuery}
                    result={result}
                    error={queryError}
                    onReset={reset}
                  />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export interface Account {
  id: string
  name: string
  currency: string
}

export interface KPI {
  impressions: number
  clicks: number
  cost: number
  conversions: number
  ctr: number
  cpa: number | null
}

export interface Campaign {
  id: string
  name: string
  status: string
  channel: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  ctr: number
  avg_cpc: number
  cpa: number | null
}

export interface AccountOverview {
  kpi: KPI
  campaigns: Campaign[]
  date_range: string
}

export interface SearchTerm {
  term: string
  status: string
  campaign: string
  ad_group: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  ctr: number
}

export interface QueryResult {
  question: string
  answer: string
  gaql: string
  rows: Record<string, unknown>[]
  count: number
}

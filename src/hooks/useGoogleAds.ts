import { useState, useCallback } from 'react'
import type { Account, AccountOverview, SearchTerm, QueryResult } from '../types'

const BASE = '/api'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || res.statusText)
  }
  return res.json()
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<Account[]>('/accounts')
      setAccounts(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { accounts, loading, error, load }
}

export function useAccountOverview() {
  const [overview, setOverview] = useState<AccountOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (accountId: string, days = 30) => {
    setLoading(true)
    setError(null)
    setOverview(null)
    try {
      const data = await apiFetch<AccountOverview>(`/accounts/${accountId}/overview?days=${days}`)
      setOverview(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { overview, loading, error, load }
}

export function useSearchTerms() {
  const [terms, setTerms] = useState<SearchTerm[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (accountId: string, days = 7) => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<SearchTerm[]>(`/accounts/${accountId}/search-terms?days=${days}&limit=200`)
      setTerms(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { terms, loading, error, load }
}

export function useNLQuery() {
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const query = useCallback(async (accountId: string, accountName: string, question: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<QueryResult>(`/accounts/${accountId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, account_name: accountName }),
      })
      setResult(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, loading, error, query, reset }
}

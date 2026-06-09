import { useState, useEffect } from 'react'
import { transactionApi } from '../services/api'
import type { Transaction, TransactionFilters } from '../services/api'

export function useTransactions(familyId: string, filters: TransactionFilters = {}) {
  const [data, setData] = useState<{
    items: Transaction[]
    total: number
    total_pages: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!familyId) return
    setLoading(true)
    transactionApi
      .list(familyId, filters)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, JSON.stringify(filters)])

  const refetch = () => {
    setLoading(true)
    transactionApi
      .list(familyId, filters)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  return { data, loading, error, refetch }
}
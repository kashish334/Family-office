import { useState, useEffect } from 'react'
import { analyticsApi } from '../services/api'

export function useDashboard(familyId: string, year: number, month: number) {
  const [data, setData] = useState<unknown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!familyId) return
    setLoading(true)
    analyticsApi
      .dashboard(familyId, year, month)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [familyId, year, month])

  return { data, loading, error }
}

export function useHealthScore(familyId: string) {
  const [data, setData] = useState<unknown | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!familyId) return
    analyticsApi
      .healthScore(familyId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [familyId])

  return { data, loading }
}
import { useState, useEffect, useCallback } from 'react'
import { notificationApi } from '../services/api'

export function useNotifications() {
  const [notifications, setNotifications] = useState<unknown[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifs = useCallback(async () => {
    try {
      const all = await notificationApi.list()
      setNotifications(all)
      setUnreadCount(all.filter((n: { is_read: boolean }) => !n.is_read).length)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifs()
  }, [fetchNotifs])

  const markRead = async (ids: string[]) => {
    await notificationApi.markRead(ids)
    await fetchNotifs()
  }

  const markAllRead = async () => {
    await notificationApi.markAllRead()
    await fetchNotifs()
  }

  return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifs }
}
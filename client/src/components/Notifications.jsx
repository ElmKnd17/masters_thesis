import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const POLLING_INTERVAL = 15000

const formatDate = (value) => {
  if (!value) return ''

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function Notifications() {
  const { authUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const containerRef = useRef(null)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  )

  const loadNotifications = useCallback(async () => {
    if (!authUser) {
      return
    }

    try {
      setIsLoading(true)
      setError('')

      const response = await api.get('/notifications')

      setNotifications(response.data || [])
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || 'Не удалось загрузить уведомления',
      )
    } finally {
      setIsLoading(false)
    }
  }, [authUser])

  useEffect(() => {
    if (!authUser) return undefined

    const timeoutId = window.setTimeout(loadNotifications, 0)
    const intervalId = window.setInterval(loadNotifications, POLLING_INTERVAL)

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [authUser, loadNotifications])

  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  const markAsRead = async (notification) => {
    if (notification.isRead) return

    try {
      setError('')

      await api.patch(`/notifications/${notification.id}/read`)

      setNotifications((currentNotifications) => currentNotifications.map(
        (currentNotification) => (
          currentNotification.id === notification.id
            ? { ...currentNotification, isRead: true }
            : currentNotification
        ),
      ))
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || 'Не удалось отметить уведомление прочитанным',
      )
    }
  }

  if (!authUser) return null

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="relative flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-lg leading-none text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-label="Уведомления"
        aria-expanded={isOpen}
      >
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 size-2.5 rounded-full bg-red-600 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="fixed left-4 right-4 top-20 z-50 border border-neutral-200 bg-white shadow-xl sm:absolute sm:left-0 sm:right-auto sm:top-12 sm:w-96">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <p className="text-sm font-medium text-neutral-950">Уведомления</p>
            {unreadCount > 0 && (
              <span className="text-xs text-neutral-500">
                Новых: {unreadCount}
              </span>
            )}
          </div>

          {error && (
            <p className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              {error}
            </p>
          )}

          <div className="max-h-[350px] overflow-y-auto">
            {isLoading && notifications.length === 0 && (
              <p className="px-4 py-6 text-sm text-neutral-500">
                Загрузка уведомлений...
              </p>
            )}

            {!isLoading && notifications.length === 0 && !error && (
              <p className="px-4 py-6 text-sm text-neutral-500">
                Уведомлений пока нет.
              </p>
            )}

            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={[
                  'block w-full border-b border-neutral-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-neutral-50',
                  notification.isRead ? 'bg-white' : 'bg-neutral-200',
                ].join(' ')}
                onClick={() => markAsRead(notification)}
              >
                <span className="block text-sm leading-6 text-neutral-800">
                  {notification.message}
                </span>
                <span className="mt-1 block text-xs text-neutral-400">
                  {formatDate(notification.createdAt)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Notifications

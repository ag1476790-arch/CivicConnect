import { useEffect, useState } from 'react'
import { FaBell, FaCheck } from 'react-icons/fa'
import api from '../services/api'

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/notifications/')
      .then((response) => {
        if (active) {
          setNotifications(response.data)
          setError('')
        }
      })
      .catch(() => {
        if (active) setError('Notifications could not be loaded.')
      })
    return () => { active = false }
  }, [])

  const markRead = async (id) => {
    try {
      const response = await api.post(`/notifications/${id}/read/`)
      setNotifications((current) => current.map((item) => item.id === id ? response.data : item))
    } catch {
      setError('This notification could not be marked as read.')
    }
  }

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/')
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })))
    } catch {
      setError('Notifications could not be marked as read.')
    }
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length

  return (
    <div className="notification-center">
      <button
        type="button"
        className="notification-toggle"
        aria-label={`${unreadCount} unread notifications`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <FaBell aria-hidden="true" />
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </button>
      {open && (
        <section className="notification-panel" aria-label="Notifications">
          <div className="notification-heading">
            <strong>Notifications</strong>
            {unreadCount > 0 && <button type="button" className="text-button" onClick={markAllRead}>Mark all read</button>}
          </div>
          {error && <p className="error-message">{error}</p>}
          {notifications.length === 0 ? (
            <p className="muted-copy">You're all caught up.</p>
          ) : (
            <ul className="notification-list">
              {notifications.map((item) => (
                <li key={item.id} className={item.is_read ? 'notification-read' : 'notification-unread'}>
                  <span>{item.message}</span>
                  {!item.is_read && (
                    <button type="button" className="icon-button" aria-label="Mark notification as read" onClick={() => markRead(item.id)}>
                      <FaCheck aria-hidden="true" />
                    </button>
                  )}
                  <small>{new Date(item.created_at).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

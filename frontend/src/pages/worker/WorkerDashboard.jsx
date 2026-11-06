import { useEffect, useState } from 'react'
import api from '../../services/api'
import mediaUrl from '../../services/mediaUrl'

export default function WorkerDashboard() {
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  const loadTasks = async () => {
    try {
      const response = await api.get('/worker/tasks/')
      setTasks(response.data)
      setError('')
    } catch {
      setError('Assigned tasks could not be loaded. Verify the backend connection and permissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    api.get('/worker/tasks/')
      .then((response) => {
        if (active) {
          setTasks(response.data)
          setError('')
        }
      })
      .catch(() => {
        if (active) setError('Assigned tasks could not be loaded. Verify the backend connection and permissions.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const updateTask = async (task, status) => {
    setSavingId(task.id)
    setError('')
    try {
      await api.patch(`/worker/tasks/${task.id}/status/`, {
        status,
        remarks: notes[task.id] || '',
      })
      await loadTasks()
    } catch (requestError) {
      const responseData = requestError.response?.data
      setError(Object.values(responseData || {}).flat().join(' ') || 'Task status could not be updated.')
    } finally {
      setSavingId(null)
    }
  }

  const visibleTasks = tasks.filter((task) => !statusFilter || task.status === statusFilter)

  return (
    <div className="app-grid">
      <div className="section-header">
        <div>
          <p className="status-pill status-assigned">Field worker queue</p>
          <h2>Assigned tasks</h2>
          <p className="muted-copy">{tasks.length} assigned complaints</p>
        </div>
        <div className="inline-actions">
          <select aria-label="Filter tasks by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All tasks</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <button type="button" className="secondary-button" onClick={loadTasks}>Refresh</button>
        </div>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}
      <section className="table-card">
        {loading ? <p className="muted-copy">Loading assigned tasks...</p> : (
          <div className="complaint-list">
            {visibleTasks.length === 0 ? (
              <div className="card">{tasks.length ? 'No tasks match this filter.' : 'No tasks are assigned to you yet.'}</div>
            ) : visibleTasks.map((task) => (
              <article key={task.id} className="complaint-item">
                <div className="complaint-meta">
                  <div>
                    <h3 className="complaint-title">{task.title}</h3>
                    <small>{task.complaint_number} · {task.category.replace('_', ' ')} · {task.priority}</small>
                  </div>
                  <span className={`status-pill status-${task.status.toLowerCase()}`}>{task.status.replace('_', ' ')}</span>
                </div>
                <p className="complaint-body">{task.description}</p>
                <p><strong>Location:</strong> {task.location}</p>
                {task.image && <a className="text-button" href={mediaUrl(task.image)} target="_blank" rel="noreferrer">View supporting photo</a>}
                <div className="worker-controls">
                  <label className="input-row">
                    Work note / resolution details
                    <textarea
                      value={notes[task.id] || ''}
                      onChange={(event) => setNotes((current) => ({ ...current, [task.id]: event.target.value }))}
                      placeholder="Describe the work completed or what remains to be done"
                    />
                  </label>
                  <div className="inline-actions">
                    {(task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS') && (
                      <button type="button" className="secondary-button" disabled={savingId === task.id || task.status === 'IN_PROGRESS'} onClick={() => updateTask(task, 'IN_PROGRESS')}>
                        Start work
                      </button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <button type="button" className="primary-button" disabled={savingId === task.id} onClick={() => updateTask(task, 'RESOLVED')}>
                        {savingId === task.id ? 'Saving...' : 'Mark resolved'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

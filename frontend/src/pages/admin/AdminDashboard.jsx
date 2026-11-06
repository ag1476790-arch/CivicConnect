import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import mediaUrl from '../../services/mediaUrl'

const defaultStats = {
  total: 0,
  submitted: 0,
  under_review: 0,
  assigned: 0,
  in_progress: 0,
  resolved: 0,
  rejected: 0,
}

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const NEW_USER = { username: '', email: '', full_name: '', phone_number: '', department: '', role: 'WORKER', password: '' }

export default function AdminDashboard() {
  const [stats, setStats] = useState(defaultStats)
  const [complaints, setComplaints] = useState([])
  const [categoryBreakdown, setCategoryBreakdown] = useState([])
  const [workers, setWorkers] = useState([])
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [edits, setEdits] = useState({})
  const [newUser, setNewUser] = useState(NEW_USER)
  const [userError, setUserError] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)
  const [history, setHistory] = useState({})
  const [historyId, setHistoryId] = useState(null)

  const loadDashboard = async () => {
    try {
      const [dashboardResponse, complaintsResponse, workersResponse, usersResponse] = await Promise.all([
        api.get('/admin/dashboard/'),
        api.get('/admin/complaints/'),
        api.get('/admin/workers/'),
        api.get('/admin/users/'),
      ])
      setStats(dashboardResponse.data.stats)
      setComplaints(complaintsResponse.data)
      setCategoryBreakdown(dashboardResponse.data.category_breakdown)
      setWorkers(workersResponse.data)
      setUsers(usersResponse.data)
      setError('')
    } catch {
      setError('Administrative data could not be loaded. Verify the backend connection and permissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('/admin/dashboard/'),
      api.get('/admin/complaints/'),
      api.get('/admin/workers/'),
      api.get('/admin/users/'),
    ])
      .then(([dashboardResponse, complaintsResponse, workersResponse, usersResponse]) => {
        if (active) {
          setStats(dashboardResponse.data.stats)
          setComplaints(complaintsResponse.data)
          setCategoryBreakdown(dashboardResponse.data.category_breakdown)
          setWorkers(workersResponse.data)
          setUsers(usersResponse.data)
          setError('')
        }
      })
      .catch(() => {
        if (active) setError('Administrative data could not be loaded. Verify the backend connection and permissions.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const visibleComplaints = useMemo(() => complaints.filter((complaint) => {
    const matchesStatus = !statusFilter || complaint.status === statusFilter
    const matchesCategory = !categoryFilter || complaint.category === categoryFilter
    const matchesPriority = !priorityFilter || complaint.priority === priorityFilter
    const text = `${complaint.title} ${complaint.complaint_number} ${complaint.location} ${complaint.citizen_name}`.toLowerCase()
    return matchesStatus && matchesCategory && matchesPriority && text.includes(query.toLowerCase())
  }), [complaints, query, statusFilter, categoryFilter, priorityFilter])

  const getEdit = (complaint) => edits[complaint.id] || {
    status: complaint.status,
    priority: complaint.priority,
    workerId: complaint.assigned_worker || '',
    remarks: '',
  }

  const updateEdit = (complaint, key, value) => {
    setEdits((current) => ({ ...current, [complaint.id]: { ...getEdit(complaint), [key]: value } }))
  }

  const saveComplaint = async (complaint) => {
    const edit = getEdit(complaint)
    setSavingId(complaint.id)
    setError('')
    try {
      if (edit.workerId && Number(edit.workerId) !== complaint.assigned_worker) {
        await api.patch(`/admin/complaints/${complaint.id}/assign/`, {
          worker_id: Number(edit.workerId),
          remarks: edit.remarks,
        })
      }
      if (edit.status !== complaint.status || edit.priority !== complaint.priority) {
        await api.patch(`/admin/complaints/${complaint.id}/status/`, {
          status: edit.status,
          priority: edit.priority,
          remarks: edit.remarks,
        })
      }
      await loadDashboard()
    } catch (requestError) {
      const responseData = requestError.response?.data
      setError(Object.values(responseData || {}).flat().join(' ') || 'The complaint could not be updated.')
    } finally {
      setSavingId(null)
    }
  }

  const createUser = async (event) => {
    event.preventDefault()
    setCreatingUser(true)
    setUserError('')
    try {
      await api.post('/admin/users/', newUser)
      setNewUser(NEW_USER)
      await loadDashboard()
    } catch (requestError) {
      setUserError(Object.values(requestError.response?.data || {}).flat().join(' ') || 'Account could not be created.')
    } finally {
      setCreatingUser(false)
    }
  }

  const changeUserStatus = async (person) => {
    try {
      await api.patch(`/admin/users/${person.id}/status/`, { is_active: !person.is_active })
      await loadDashboard()
    } catch (requestError) {
      setUserError(Object.values(requestError.response?.data || {}).flat().join(' ') || 'Account status could not be changed.')
    }
  }

  const toggleHistory = async (complaintId) => {
    if (historyId === complaintId) {
      setHistoryId(null)
      return
    }
    setHistoryId(complaintId)
    if (history[complaintId]) return
    try {
      const response = await api.get(`/complaints/${complaintId}/`)
      setHistory((current) => ({ ...current, [complaintId]: response.data.history }))
    } catch {
      setError('Complaint history could not be loaded.')
    }
  }

  return (
    <div className="app-grid">
      <div className="section-header">
        <div>
          <p className="status-pill status-assigned">Admin dashboard</p>
          <h2>Municipal operations overview</h2>
        </div>
        <button type="button" className="secondary-button" onClick={loadDashboard}>Refresh</button>
      </div>

      <section className="stat-grid">
        {[
          ['Total complaints', stats.total],
          ['Submitted', stats.submitted],
          ['Under review', stats.under_review],
          ['Assigned', stats.assigned],
          ['In progress', stats.in_progress],
          ['Resolved', stats.resolved],
          ['Rejected', stats.rejected],
        ].map(([label, value]) => (
          <div key={label} className="stat-card">
            <div className="metric-label">{label}</div>
            <div className="metric-value">{value}</div>
          </div>
        ))}
      </section>

      {error && <p className="error-message" role="alert">{error}</p>}

      <section className="table-card">
        <div className="section-header"><h3>Reports by category</h3></div>
        <div className="inline-actions">
          {categoryBreakdown.length === 0 ? <p className="muted-copy">No complaint data available.</p> : categoryBreakdown.map((item) => (
            <span className="small-button" key={item.category}>{item.category.replace('_', ' ')}: {item.count}</span>
          ))}
        </div>
      </section>

      <section className="table-card admin-list-card">
        <div className="section-header">
          <div>
            <h3>Complaint management</h3>
            <p className="muted-copy">Review reports, set priority, update status, and assign field workers.</p>
          </div>
        </div>
        <div className="filter-row">
          <input aria-label="Search all complaints" placeholder="Search title, number, citizen, or location" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
          </select>
          <select aria-label="Filter by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="">All categories</option>
            {['ROADS', 'GARBAGE', 'STREETLIGHT', 'WATER_SUPPLY', 'DRAINAGE', 'PUBLIC_INFRASTRUCTURE', 'SAFETY', 'OTHER'].map((category) => <option key={category} value={category}>{category.replace('_', ' ')}</option>)}
          </select>
          <select aria-label="Filter by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="">All priorities</option>
            {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </div>
        {loading ? <p className="muted-copy">Loading administrative data...</p> : (
          <div className="complaint-list">
            {visibleComplaints.length === 0 ? <div className="card">No complaints match this view.</div> : visibleComplaints.map((complaint) => {
              const edit = getEdit(complaint)
              return (
                <article key={complaint.id} className="complaint-item">
                  <div className="complaint-meta">
                    <div>
                      <h4 className="complaint-title">{complaint.title}</h4>
                      <small>{complaint.complaint_number} · {complaint.citizen_name} · {complaint.location}</small>
                    </div>
                    <span className={`status-pill status-${complaint.status.toLowerCase()}`}>{complaint.status.replace('_', ' ')}</span>
                  </div>
                  <p className="complaint-body">{complaint.description}</p>
                  <div className="inline-actions">
                    <span className="small-button">{complaint.category.replace('_', ' ')}</span>
                    {complaint.image && <a className="text-button" href={mediaUrl(complaint.image)} target="_blank" rel="noreferrer">View evidence photo</a>}
                    <button type="button" className="text-button" onClick={() => toggleHistory(complaint.id)}>
                      {historyId === complaint.id ? 'Hide history' : 'View history'}
                    </button>
                  </div>
                  {historyId === complaint.id && (
                    <div className="history-list">
                      {!history[complaint.id] ? <p className="muted-copy">Loading complaint history...</p> : history[complaint.id].map((entry) => (
                        <div className="history-entry" key={entry.id}>
                          <span className={`status-pill status-${entry.new_status.toLowerCase()}`}>{entry.new_status.replace('_', ' ')}</span>
                          <span>{entry.remarks || 'Status updated'} · {entry.updated_by_name}</span>
                          <small>{new Date(entry.created_at).toLocaleString()}</small>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="admin-controls">
                    <label className="input-row">
                      Status
                      <select value={edit.status} onChange={(event) => updateEdit(complaint, 'status', event.target.value)}>
                        {STATUSES.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
                      </select>
                    </label>
                    <label className="input-row">
                      Priority
                      <select value={edit.priority} onChange={(event) => updateEdit(complaint, 'priority', event.target.value)}>
                        {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                      </select>
                    </label>
                    <label className="input-row">
                      Assign worker
                      <select value={edit.workerId} onChange={(event) => updateEdit(complaint, 'workerId', event.target.value)}>
                        <option value="">Unassigned</option>
                        {workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.full_name} ({worker.task_count} tasks)</option>)}
                      </select>
                    </label>
                    <label className="input-row">
                      Update note
                      <input value={edit.remarks} onChange={(event) => updateEdit(complaint, 'remarks', event.target.value)} placeholder="Optional note for the history" />
                    </label>
                    <button type="button" className="primary-button" disabled={savingId === complaint.id} onClick={() => saveComplaint(complaint)}>
                      {savingId === complaint.id ? 'Saving...' : 'Save updates'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="table-card">
        <div className="section-header">
          <div>
            <h3>People and workforce</h3>
            <p className="muted-copy">{users.length} accounts · {workers.length} field workers</p>
          </div>
        </div>
        <form className="admin-controls user-create-form" onSubmit={createUser}>
          <label className="input-row">Full name<input required value={newUser.full_name} onChange={(event) => setNewUser((current) => ({ ...current, full_name: event.target.value }))} /></label>
          <label className="input-row">Username<input required value={newUser.username} onChange={(event) => setNewUser((current) => ({ ...current, username: event.target.value }))} /></label>
          <label className="input-row">Email<input type="email" value={newUser.email} onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))} /></label>
          <label className="input-row">Phone<input value={newUser.phone_number} onChange={(event) => setNewUser((current) => ({ ...current, phone_number: event.target.value }))} /></label>
          <label className="input-row">Department<input value={newUser.department} onChange={(event) => setNewUser((current) => ({ ...current, department: event.target.value }))} /></label>
          <label className="input-row">Role<select value={newUser.role} onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value }))}><option value="WORKER">Field worker</option><option value="CITIZEN">Citizen</option></select></label>
          <label className="input-row">Temporary password<input type="password" minLength="8" required value={newUser.password} onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))} /></label>
          {userError && <p className="error-message" role="alert">{userError}</p>}
          <button type="submit" className="primary-button" disabled={creatingUser}>{creatingUser ? 'Creating...' : 'Create account'}</button>
        </form>
        <div className="people-grid">
          {users.map((person) => (
            <article key={person.id} className="person-card">
              <strong>{person.full_name}</strong>
              <span>{person.username} · {person.role} · {person.is_active ? 'Active' : 'Inactive'}</span>
              <small>{person.email || 'No email provided'}</small>
              {person.role !== 'ADMIN' && (
                <button type="button" className="text-button" onClick={() => changeUserStatus(person)}>
                  {person.is_active ? 'Deactivate account' : 'Reactivate account'}
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

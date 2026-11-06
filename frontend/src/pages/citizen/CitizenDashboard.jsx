import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import mediaUrl from '../../services/mediaUrl'
import useAuth from '../../hooks/useAuth'

const initialComplaint = {
  title: '',
  description: '',
  category: 'ROADS',
  location: '',
  priority: 'MEDIUM',
}

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [form, setForm] = useState(initialComplaint)
  const [image, setImage] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [details, setDetails] = useState({})

  const loadComplaints = async () => {
    try {
      const response = await api.get('/citizen/complaints/')
      setComplaints(response.data)
      setError('')
    } catch {
      setError('Your complaints could not be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    api.get('/citizen/complaints/')
      .then((response) => {
        if (active) {
          setComplaints(response.data)
          setError('')
        }
      })
      .catch(() => {
        if (active) setError('Your complaints could not be loaded. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const visibleComplaints = useMemo(() => complaints.filter((complaint) => {
    const matchesStatus = !statusFilter || complaint.status === statusFilter
    const searchText = `${complaint.title} ${complaint.complaint_number} ${complaint.location}`.toLowerCase()
    return matchesStatus && searchText.includes(query.toLowerCase())
  }), [complaints, query, statusFilter])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => data.append(key, value))
    if (image) data.append('image', image)

    try {
      await api.post('/citizen/complaints/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm(initialComplaint)
      setImage(null)
      event.target.reset()
      setMessage('Complaint submitted successfully.')
      await loadComplaints()
    } catch (requestError) {
      const responseData = requestError.response?.data
      setError(Object.values(responseData || {}).flat().join(' ') || 'Unable to submit complaint. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleDetails = async (complaintId) => {
    if (expandedId === complaintId) {
      setExpandedId(null)
      return
    }
    setExpandedId(complaintId)
    if (details[complaintId]) return
    try {
      const response = await api.get(`/citizen/complaints/${complaintId}/`)
      setDetails((current) => ({ ...current, [complaintId]: response.data }))
    } catch {
      setError('Complaint history could not be loaded.')
    }
  }

  return (
    <div className="app-grid">
      <div className="section-header">
        <div>
          <p className="status-pill status-assigned">Citizen dashboard</p>
          <h2>Welcome, {user?.full_name || user?.username}</h2>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="table-card">
          <div className="section-header">
            <h3>My complaints</h3>
            <span className="muted-copy">{complaints.length} total</span>
          </div>
          <div className="filter-row">
            <input aria-label="Search complaints" placeholder="Search title, number, or location" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          {error && <p className="error-message" role="alert">{error}</p>}
          <div className="complaint-list">
            {loading ? (
              <p className="muted-copy">Loading your complaints...</p>
            ) : visibleComplaints.length === 0 ? (
              <div className="card">{complaints.length ? 'No complaints match your filters.' : 'No complaints yet. Submit your first issue.'}</div>
            ) : (
              visibleComplaints.map((complaint) => {
                const detail = details[complaint.id]
                return (
                  <article key={complaint.id} className="complaint-item">
                    <div className="complaint-meta">
                      <h4 className="complaint-title">{complaint.title}</h4>
                      <span className={`status-pill status-${complaint.status.toLowerCase()}`}>{complaint.status.replace('_', ' ')}</span>
                    </div>
                    <p className="complaint-body">{complaint.description}</p>
                    <div className="inline-actions">
                      <span className="small-button">{complaint.complaint_number}</span>
                      <span className="small-button">{complaint.category.replace('_', ' ')}</span>
                      <span className="small-button">{complaint.location}</span>
                      <span className="small-button">{complaint.priority}</span>
                      <button type="button" className="text-button" onClick={() => toggleDetails(complaint.id)}>
                        {expandedId === complaint.id ? 'Hide history' : 'View history'}
                      </button>
                    </div>
                    {complaint.image && <img className="complaint-image" src={mediaUrl(complaint.image)} alt={`Evidence for ${complaint.title}`} />}
                    {expandedId === complaint.id && (
                      <div className="history-list">
                        {!detail ? <p className="muted-copy">Loading complaint history...</p> : (
                          <>
                            <strong>Complaint timeline</strong>
                            {detail.history.map((entry) => (
                              <div className="history-entry" key={entry.id}>
                                <span className={`status-pill status-${entry.new_status.toLowerCase()}`}>{entry.new_status.replace('_', ' ')}</span>
                                <span>{entry.remarks || 'Status updated'}</span>
                                <small>{new Date(entry.created_at).toLocaleString()}</small>
                              </div>
                            ))}
                            {detail.resolved_at && <p className="muted-copy">Resolved on {new Date(detail.resolved_at).toLocaleString()}</p>}
                          </>
                        )}
                      </div>
                    )}
                  </article>
                )
              })
            )}
          </div>
        </section>

        <aside className="form-card">
          <h3>Submit new complaint</h3>
          <form className="form-inline" onSubmit={handleSubmit}>
            <div className="input-row">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" value={form.title} onChange={handleChange} maxLength="255" required />
            </div>
            <div className="input-row">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" value={form.description} onChange={handleChange} required />
            </div>
            <div className="input-row">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" value={form.category} onChange={handleChange}>
                <option value="ROADS">Roads</option>
                <option value="GARBAGE">Garbage</option>
                <option value="STREETLIGHT">Streetlight</option>
                <option value="WATER_SUPPLY">Water supply</option>
                <option value="DRAINAGE">Drainage</option>
                <option value="PUBLIC_INFRASTRUCTURE">Public infrastructure</option>
                <option value="SAFETY">Safety</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="input-row">
              <label htmlFor="location">Location</label>
              <input id="location" name="location" value={form.location} onChange={handleChange} maxLength="255" required />
            </div>
            <div className="input-row">
              <label htmlFor="priority">Priority</label>
              <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="input-row">
              <label htmlFor="image">Supporting photo (optional)</label>
              <input id="image" type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] || null)} />
            </div>
            {message && <div className="toast" role="status">{message}</div>}
            {error && <p className="error-message" role="alert">{error}</p>}
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit complaint'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  )
}

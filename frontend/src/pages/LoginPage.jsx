import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuth from '../hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await api.post('/auth/login/', form)
      const user = response.data.user
      setUser({ ...user, token: response.data.token })
      if (user.role === 'ADMIN') navigate('/admin')
      else if (user.role === 'WORKER') navigate('/worker')
      else navigate('/citizen')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      <aside className="side-panel">
        <h2>Welcome back</h2>
        <p>Track service requests, manage assignments, and keep residents informed.</p>
      </aside>

      <section className="form-card">
        <div className="section-header">
          <div>
            <p className="status-pill status-assigned">Portal access</p>
            <h2>Login to CivicConnect</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="input-row">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" value={form.username} onChange={handleChange} required />
          </div>

          <div className="input-row">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" value={form.password} onChange={handleChange} required />
          </div>

          {error && <div className="toast">{error}</div>}

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '1rem' }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </div>
  )
}

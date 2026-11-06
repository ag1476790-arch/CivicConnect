import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuth from '../hooks/useAuth'

const INITIAL_FORM = {
  username: '',
  email: '',
  full_name: '',
  phone_number: '',
  password: '',
  password_confirm: '',
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [form, setForm] = useState(INITIAL_FORM)
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
      const response = await api.post('/auth/register/', form)
      const user = response.data.user
      setUser({ ...user, token: response.data.token })
      if (user.role === 'ADMIN') navigate('/admin')
      else if (user.role === 'WORKER') navigate('/worker')
      else navigate('/citizen')
    } catch (err) {
      const data = err.response?.data
      setError(Object.values(data || {}).flat().join(' ') || 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      <aside className="side-panel">
        <h2>Join the civic network</h2>
        <p>Register as a citizen to report issues or as a field worker to support resolution teams.</p>
      </aside>

      <section className="form-card">
        <div className="section-header">
          <div>
            <p className="status-pill status-assigned">New account</p>
            <h2>Create your account</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="input-row">
            <label htmlFor="full_name">Full name</label>
            <input id="full_name" name="full_name" value={form.full_name} onChange={handleChange} required />
          </div>

          <div className="input-row">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" value={form.username} onChange={handleChange} required />
          </div>

          <div className="input-row">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>

          <div className="input-row">
            <label htmlFor="phone_number">Phone number</label>
            <input id="phone_number" name="phone_number" value={form.phone_number} onChange={handleChange} />
          </div>

          <div className="input-row">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" value={form.password} onChange={handleChange} required />
          </div>

          <div className="input-row">
            <label htmlFor="password_confirm">Confirm password</label>
            <input id="password_confirm" type="password" name="password_confirm" value={form.password_confirm} onChange={handleChange} required />
          </div>

          {error && <div className="toast">{error}</div>}

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="form-note">Public registration creates a citizen account. Worker and administrator accounts are provisioned by municipal administrators.</p>
        <p style={{ marginTop: '1rem' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </section>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { FaClipboardCheck, FaMapMarkerAlt, FaUsers } from 'react-icons/fa'

const features = [
  {
    icon: FaMapMarkerAlt,
    title: 'Citizen reporting',
    description: 'Submit civic issues with photo evidence, category tags, location details, and urgency levels.',
  },
  {
    icon: FaUsers,
    title: 'Smart triage',
    description: 'Administrators review reports, prioritize work, and assign cases to municipal field workers.',
  },
  {
    icon: FaClipboardCheck,
    title: 'Status tracking',
    description: 'Follow complaint progress from submission to resolution with transparent history and notifications.',
  },
]

export default function HomePage() {
  return (
    <div className="app-grid">
      <section className="hero-section">
        <div className="hero-row">
          <div>
            <p className="status-pill status-assigned">Public service platform</p>
            <h1 className="hero-title">Fix civic issues faster with CivicConnect.</h1>
            <p className="hero-copy">
              Empower citizens to report problems, help administrators manage resolution priorities, and give field teams a clear queue of tasks in one shared system.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="primary-button">Create account</Link>
              <Link to="/login" className="secondary-button">Sign in</Link>
            </div>
          </div>

          <div className="hero-panel">
            <div className="context-box">
              <span className="hero-icon"><FaMapMarkerAlt aria-hidden="true" /></span>
              <h3>One clear path from report to resolution</h3>
              <p>Every complaint has an owner, a visible status, and a recorded history.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {features.map(({ icon: Icon, title, description }) => (
          <article key={title} className="feature-card card">
            <Icon className="feature-icon" aria-hidden="true" />
            <h3>{title}</h3>
            <p className="hero-copy">{description}</p>
          </article>
        ))}
      </section>

      <section className="how-it-works">
        <div>
          <p className="status-pill status-assigned">How it works</p>
          <h2>From neighborhood issue to accountable action</h2>
        </div>
        <ol className="steps-grid">
          <li><span>01</span><strong>Report</strong><p>Share the issue, location, priority, and a supporting photo.</p></li>
          <li><span>02</span><strong>Assign</strong><p>Municipal administrators review the report and route it to a field worker.</p></li>
          <li><span>03</span><strong>Resolve</strong><p>Follow progress and read the complaint history as work is completed.</p></li>
        </ol>
      </section>

      <section className="cta-panel">
        <div>
          <h2>Help improve your community.</h2>
          <p>Report an issue or sign in to follow your existing requests.</p>
        </div>
        <div className="hero-actions">
          <Link to="/register" className="primary-button">Get started</Link>
          <Link to="/login" className="secondary-button">Sign in</Link>
        </div>
      </section>
      <footer className="site-footer">CivicConnect · A transparent path to better public services.</footer>
    </div>
  )
}

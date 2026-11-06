import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import useAuth from './hooks/useAuth'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CitizenDashboard from './pages/citizen/CitizenDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import WorkerDashboard from './pages/worker/WorkerDashboard'
import NotificationCenter from './components/NotificationCenter'

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppLayout() {
  const { user, logout, logoutError } = useAuth()

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">C</div>
          <div>
            <div className="brand-name">CivicConnect</div>
            <div className="brand-subtitle">Smart public service portal</div>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          {!user && (
            <>
              <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Login
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Register
              </NavLink>
            </>
          )}
          {user && (
            <>
              {user.role === 'CITIZEN' && (
                <NavLink to="/citizen" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  My complaints
                </NavLink>
              )}
              {user.role === 'ADMIN' && (
                <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Admin dashboard
                </NavLink>
              )}
              {user.role === 'WORKER' && (
                <NavLink to="/worker" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Work queue
                </NavLink>
              )}
            </>
          )}
        </nav>

        {user ? (
          <div className="user-badge">
            <span>{user.full_name || user.username}</span>
            <NotificationCenter />
            <button type="button" className="logout-button" onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="user-badge guest">Guest portal</div>
        )}
      </header>

      <main className="content-area">
        {logoutError && <p className="error-message global-message" role="alert">{logoutError}</p>}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/citizen"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker"
            element={
              <ProtectedRoute allowedRoles={['WORKER']}>
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

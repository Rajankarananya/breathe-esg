import { Navigate, Route, Routes, Link, useNavigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Upload from './pages/Upload'

const navStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 40px',
  background: 'rgba(15, 21, 36, 0.75)',
  backdropFilter: 'blur(16px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
}

const logoContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  textDecoration: 'none',
}

const logoTextStyle = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.25rem',
  fontWeight: '800',
  letterSpacing: '-0.02em',
  background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}

const linksContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const linkStyle = (isActive) => ({
  color: isActive ? '#f8fafc' : '#94a3b8',
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: '600',
  padding: '8px 16px',
  borderRadius: '8px',
  background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
  transition: 'all 0.2s ease',
  border: isActive ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
})

const buttonStyle = {
  background: 'transparent',
  color: '#94a3b8',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
}

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

const Navigation = () => {
  const navigate = useNavigate()
  const token = localStorage.getItem('access_token')
  const currentPath = window.location.pathname

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login')
  }

  if (!token) {
    return null
  }

  return (
    <div style={navStyle}>
      <Link to="/dashboard" style={logoContainerStyle}>
        {/* Leaf Planet SVG Logo */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="url(#logo-grad-b)" opacity="0.15"/>
          <path d="M2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12C22 12.5 21.8 13.5 21.2 14.5C19.5 17.5 15.5 21 12 21C8 21 4.5 17.5 2.8 14.5C2.2 13.5 2 12.5 2 12Z" fill="url(#logo-grad-a)"/>
          <path d="M12 6C8.68 6 6 8.68 6 12C6 15 10 19 12 20C14 19 18 15 18 12C18 8.68 15.32 6 12 6Z" fill="#070a13" opacity="0.3"/>
          <defs>
            <linearGradient id="logo-grad-a" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="logo-grad-b" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <span style={logoTextStyle}>Breathe ESG</span>
      </Link>
      
      <div style={linksContainerStyle}>
        <Link to="/dashboard" style={linkStyle(currentPath === '/dashboard' || currentPath === '/')}>
          Dashboard
        </Link>
        <Link to="/upload" style={linkStyle(currentPath === '/upload')}>
          Upload
        </Link>
        <button 
          type="button" 
          style={buttonStyle} 
          onClick={handleLogout}
          onMouseEnter={(e) => {
            e.target.style.borderColor = 'rgba(244, 63, 94, 0.4)'
            e.target.style.color = '#f43f5e'
            e.target.style.background = 'rgba(244, 63, 94, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            e.target.style.color = '#94a3b8'
            e.target.style.background = 'transparent'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <>
      <Navigation />
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </>
  )
}

export default App

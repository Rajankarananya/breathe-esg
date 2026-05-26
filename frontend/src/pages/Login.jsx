import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#070a13',
  padding: '24px',
  backgroundImage: `
    radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.08) 0px, transparent 50%)
  `,
}

const cardStyle = {
  width: '100%',
  maxWidth: '440px',
  background: '#0f1524',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '20px',
  padding: '40px',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
}

const headerStyle = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.75rem',
  fontWeight: '800',
  letterSpacing: '-0.02em',
  marginBottom: '6px',
  background: 'linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textAlign: 'center',
}

const subheaderStyle = {
  color: '#94a3b8',
  fontSize: '0.875rem',
  textAlign: 'center',
  marginBottom: '32px',
}

const inputStyle = {
  width: '100%',
  background: '#070a13',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '10px',
  color: '#f8fafc',
  padding: '12px 16px',
  fontSize: '0.925rem',
  transition: 'all 0.2s ease',
  outline: 'none',
}

const buttonStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  border: 'none',
  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  color: '#ffffff',
  fontSize: '0.925rem',
  fontWeight: '600',
  fontFamily: 'var(--font-heading)',
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
  transition: 'all 0.2s ease',
  marginTop: '10px',
}

const errorStyle = {
  color: '#f43f5e',
  background: 'rgba(244, 63, 94, 0.08)',
  border: '1px solid rgba(244, 63, 94, 0.15)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '0.85rem',
  marginBottom: '18px',
  textAlign: 'center',
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await client.post('/api/token/', {
        username,
        password,
      })
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12C22 12.5 21.8 13.5 21.2 14.5C19.5 17.5 15.5 21 12 21C8 21 4.5 17.5 2.8 14.5C2.2 13.5 2 12.5 2 12Z" fill="url(#login-grad)"/>
            <path d="M12 6C8.68 6 6 8.68 6 12C6 15 10 19 12 20C14 19 18 15 18 12C18 8.68 15.32 6 12 6Z" fill="#070a13" opacity="0.35"/>
            <defs>
              <linearGradient id="login-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <h1 style={headerStyle}>Breathe ESG</h1>
        <p style={subheaderStyle}>Secure Analyst Authentication</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Username
            </label>
            <input
              style={inputStyle}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              type="text"
              required
              placeholder="e.g. esg_analyst"
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1'
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Password
            </label>
            <input
              style={inputStyle}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              placeholder="••••••••"
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1'
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
          
          {error ? <div style={errorStyle}>{error}</div> : null}
          
          <button 
            style={buttonStyle} 
            type="submit" 
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.35)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'none'
              e.target.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.25)'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}

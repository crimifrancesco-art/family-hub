import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { AppProvider } from './context/AppContext'
import DashboardPage from './pages/DashboardPage'
import ArchivioPage from './pages/ArchivioPage'
import SalutePage from './pages/SalutePage'
import ViaggiPage from './pages/ViaggiPage'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { key: 'archivio', label: 'Archivio', icon: '🗂️' },
  { key: 'salute', label: 'Salute & Terapie', icon: '❤️' },
  { key: 'viaggi', label: 'Viaggi', icon: '✈️' },
]

function getInitials(email) {
  if (!email) return 'FH'
  const value = email.split('@')[0] || ''
  return value.slice(0, 2).toUpperCase() || 'FH'
}

function LoginScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Registrazione completata. Controlla la mail di conferma, se richiesta.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error) {
      setMessage(error?.message || 'Operazione non riuscita.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">🏡</div>
        <h1 className="login-title">Family Hub</h1>
        <p className="muted" style={{ textAlign: 'center', marginBottom: 20 }}>
          Accedi per usare l’app collegata a Supabase
        </p>

        <form onSubmit={submit} className="form-grid">
          <label>
            <span className="fl">Email</span>
            <input
              className={`fi ${email ? 'field-active' : ''}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span className="fl">Password</span>
            <input
              className={`fi ${password ? 'field-active' : ''}`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {message ? <div className="error-msg">{message}</div> : null}

          <button className="btn btn-p" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Attendere...' : mode === 'login' ? 'Accedi' : 'Registrati'}
          </button>
        </form>

        <div className="login-switch">
          <button
            type="button"
            className="btn-link"
            onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
          >
            {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AppShell({ session }) {
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const activeItem = useMemo(
    () => NAV_ITEMS.find((item) => item.key === activePage) || NAV_ITEMS[0],
    [activePage]
  )

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false)
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.style.overflow = sidebarOpen ? 'hidden' : 'auto'
    }

    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [sidebarOpen])

  const handleNavigate = (key) => {
    setActivePage(key)
    if (window.innerWidth <= 768) setSidebarOpen(false)
  }

  const renderPage = () => {
    switch (activePage) {
      case 'archivio':
        return <ArchivioPage />
      case 'salute':
        return <SalutePage />
      case 'viaggi':
        return <ViaggiPage />
      case 'dashboard':
      default:
        return <DashboardPage />
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSidebarOpen(false)
  }

  return (
    <div className="app-layout">
      {sidebarOpen ? (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Chiudi sidebar"
        />
      ) : null}

      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
        aria-hidden={typeof window !== 'undefined' && window.innerWidth <= 768 ? !sidebarOpen : false}
      >
        <div className="sidebar-logo" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🏡</span>
            <span>Family Hub</span>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Chiudi sidebar"
            title="Chiudi sidebar"
          >
            ✕
          </button>
        </div>

        <ul className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className={`nav-item ${activePage === item.key ? 'active' : ''}`}
                onClick={() => handleNavigate(item.key)}
                aria-current={activePage === item.key ? 'page' : undefined}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="meta-chip">{getInitials(session?.user?.email)}</div>
            <div className="user-email">{session?.user?.email || 'Utente'}</div>
          </div>

          <button type="button" className="btn-logout" onClick={logout}>
            Esci
          </button>
        </div>
      </aside>

      <div className="app-main">
        <div className="mobile-topbar">
          <div className="topbar-actions">
            <button
              type="button"
              className="icon-btn hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Apri sidebar"
              title="Apri sidebar"
            >
              ☰
            </button>
          </div>

          <div className="topbar-title">{activeItem.label}</div>

          <div className="topbar-actions">
            <button type="button" className="icon-btn" onClick={logout} aria-label="Esci" title="Esci">
              ⎋
            </button>
          </div>
        </div>

        <main className="app-content">{renderPage()}</main>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session || null)
      setLoadingAuth(false)
    }

    load()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null)
      setLoadingAuth(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loadingAuth) {
    return (
      <div className="loading-screen">
        <div className="login-logo">⏳</div>
        <div>Controllo accesso in corso…</div>
      </div>
    )
  }

  if (!session) return <LoginScreen />

  return (
    <AppProvider>
      <AppShell session={session} />
    </AppProvider>
  )
}
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
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">🏡</div>
        <h1 className="login-title">Family Hub</h1>
        <p className="muted" style={{ textAlign: 'center' }}>
          Accedi per usare l’app collegata a Supabase.
        </p>

        {message ? <div className="app-status">{message}</div> : null}

        <div className="fg">
          <label className="fl">Email</label>
          <input
            className="fi"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@email.it"
            required
          />
        </div>

        <div className="fg">
          <label className="fl">Password</label>
          <input
            className="fi"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button className="btn btn-p" type="submit" disabled={loading}>
          {loading ? 'Attendere...' : mode === 'register' ? 'Registrati' : 'Accedi'}
        </button>

        <div className="login-switch">
          <button
            type="button"
            className="btn-link"
            onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
          >
            {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Shell({ session }) {
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const userEmail = session?.user?.email || ''
  const userInitials = useMemo(() => getInitials(userEmail), [userEmail])

  const closeSidebar = () => setSidebarOpen(false)
  const toggleSidebar = () => setSidebarOpen((prev) => !prev)

  useEffect(() => {
    closeSidebar()
  }, [activePage])

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

  return (
    <div className="app-layout">
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden={!sidebarOpen}
      />

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-main">
            <div className="sidebar-logo-badge">FH</div>
            <div>
              <div>Family Hub</div>
              <div className="muted small-text">Casa, salute, archivio, viaggi</div>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close icon-btn"
            onClick={closeSidebar}
            aria-label="Nascondi sidebar"
            title="Nascondi sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav-wrap">
          <ul className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={`nav-item ${activePage === item.key ? 'active' : ''}`}
                  onClick={() => setActivePage(item.key)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{userInitials}</div>
            <div className="user-meta">
              <div className="small-text">Account attivo</div>
              <div className="user-email">{userEmail || 'utente@familyhub.local'}</div>
            </div>
          </div>

          <button
            type="button"
            className="btn-logout"
            onClick={() => supabase.auth.signOut()}
          >
            Esci
          </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="mobile-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-btn hamburger"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'Nascondi sidebar' : 'Mostra sidebar'}
              title={sidebarOpen ? 'Nascondi sidebar' : 'Mostra sidebar'}
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
            <div className="topbar-title">Family Hub</div>
          </div>

          <div className="topbar-actions">
            <span className="member-chip">{activePage}</span>
          </div>
        </header>

        <div className="desktop-toolbar">
          <button
            type="button"
            className="btn btn-s"
            onClick={toggleSidebar}
          >
            {sidebarOpen ? 'Nascondi sidebar' : 'Mostra sidebar'}
          </button>
        </div>

        <section className="app-content">{renderPage()}</section>
      </main>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (session === undefined) {
    return (
      <div className="loading-screen">
        <div className="sidebar-logo-badge">FH</div>
        <div>Caricamento sessione…</div>
      </div>
    )
  }

  if (!session) {
    return <LoginScreen />
  }

  return (
    <AppProvider>
      <Shell session={session} />
    </AppProvider>
  )
}
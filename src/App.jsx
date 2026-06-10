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
  { key: 'salute', label: 'Salute', icon: '🩺' },
  { key: 'viaggi', label: 'Viaggi', icon: '✈️' },
]

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  archivio: 'Archivio',
  salute: 'Salute',
  viaggi: 'Viaggi',
}

function getInitials(email) {
  if (!email) return 'FH'
  const value = email.split('@')[0] || ''
  return value.slice(0, 2).toUpperCase() || 'FH'
}

function renderPage(currentPage) {
  if (currentPage === 'archivio') return <ArchivioPage />
  if (currentPage === 'salute') return <SalutePage />
  if (currentPage === 'viaggi') return <ViaggiPage />
  return <DashboardPage />
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
        <h1 className="login-title">
          {mode === 'login' ? 'Accedi a Family Hub' : 'Crea il tuo account'}
        </h1>
        <p className="page-subtitle" style={{ textAlign: 'center', marginBottom: 18 }}>
          Un unico spazio per famiglia, salute, archivio e viaggi.
        </p>

        {message ? <div className="error-msg">{message}</div> : null}

        <div className="form-shell">
          <label className="fg">
            <span className="fl">Email</span>
            <input
              className="fi"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@famiglia.it"
              required
            />
          </label>

          <label className="fg">
            <span className="fl">Password</span>
            <input
              className="fi"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Inserisci password"
              required
            />
          </label>

          <button type="submit" className="btn btn-p" disabled={loading}>
            {loading
              ? mode === 'login'
                ? 'Accesso in corso...'
                : 'Registrazione in corso...'
              : mode === 'login'
                ? 'Accedi'
                : 'Registrati'}
          </button>
        </div>

        <div className="login-switch">
          {mode === 'login' ? (
            <>
              <span className="muted">Non hai ancora un account? </span>
              <button type="button" className="btn-link" onClick={() => setMode('register')}>
                Registrati
              </button>
            </>
          ) : (
            <>
              <span className="muted">Hai già un account? </span>
              <button type="button" className="btn-link" onClick={() => setMode('login')}>
                Accedi
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}

function AppShell({ session }) {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const userEmail = session?.user?.email || ''
  const initials = useMemo(() => getInitials(userEmail), [userEmail])
  const pageTitle = PAGE_TITLES[currentPage] || 'Family Hub'

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
    }
  }, [currentPage])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    if (window.innerWidth <= 768 && sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = previousOverflow || ''
    }
  }, [sidebarOpen])

  const openSidebar = () => setSidebarOpen(true)
  const closeSidebar = () => setSidebarOpen(false)

  const navigateTo = (pageKey) => {
    setCurrentPage(pageKey)
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AppProvider>
      <div className="app-layout">
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-logo">
            <div className="sidebar-logo-main">
              <div className="sidebar-logo-badge">FH</div>
              <div>
                <div className="strong">Family Hub</div>
                <div className="small-text">Casa, salute, archivio e viaggi</div>
              </div>
            </div>

            <button
              type="button"
              className="icon-btn sidebar-close"
              onClick={closeSidebar}
              aria-label="Chiudi sidebar"
              title="Chiudi sidebar"
            >
              ✕
            </button>
          </div>

          <div className="sidebar-nav-wrap">
            <ul className="sidebar-nav">
              {NAV_ITEMS.map((item) => {
                const isActive = currentPage === item.key

                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => navigateTo(item.key)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="nav-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">{initials}</div>
              <div className="user-meta">
                <div className="small-text">Connesso come</div>
                <div className="user-email">{userEmail || 'utente'}</div>
              </div>
            </div>

            <button type="button" className="btn-logout" onClick={logout}>
              Esci
            </button>
          </div>
        </aside>

        <button
          type="button"
          className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
          aria-label="Chiudi menu"
          onClick={closeSidebar}
        />

        <div className="app-main">
          <div className="mobile-topbar">
            <div className="topbar-left">
              <button
                type="button"
                className="hamburger icon-btn"
                onClick={openSidebar}
                aria-label="Apri sidebar"
                title="Apri sidebar"
              >
                ☰
              </button>

              <div className="topbar-title">{pageTitle}</div>
            </div>

            <div className="topbar-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={closeSidebar}
                aria-label="Chiudi sidebar"
                title="Chiudi sidebar"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="desktop-toolbar">
            <div className="badge badge-dash">{pageTitle}</div>
          </div>

          <main className="app-content">{renderPage(currentPage)}</main>
        </div>
      </div>
    </AppProvider>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      setLoadingSession(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
      setLoadingSession(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loadingSession) {
    return (
      <div className="loading-screen">
        <div className="login-logo">⏳</div>
        <div className="muted">Caricamento Family Hub...</div>
      </div>
    )
  }

  if (!session) {
    return <LoginScreen />
  }

  return <AppShell session={session} />
}
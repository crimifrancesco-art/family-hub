import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { AppProvider } from './context/AppContext'
import DashboardPage from './pages/DashboardPage'
import ArchivioPage  from './pages/ArchivioPage'
import SalutePage    from './pages/SalutePage'
import ViaggiPage    from './pages/ViaggiPage'

/* ── Sezioni di navigazione ── */
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Home',    icon: '🏠', cls: '' },
  { key: 'archivio',  label: 'Archivio', icon: '🗂️', cls: 'nav-archivio' },
  { key: 'salute',    label: 'Salute',   icon: '❤️', cls: 'nav-salute' },
  { key: 'viaggi',    label: 'Viaggi',   icon: '✈️', cls: 'nav-viaggi' },
]

const PAGE_TITLES = {
  dashboard: 'FamilyHub',
  archivio:  'Archivio',
  salute:    'Salute & Terapie',
  viaggi:    'Viaggi',
}

function getInitials(email) {
  if (!email) return 'FH'
  return (email.split('@')[0] || '').slice(0, 2).toUpperCase() || 'FH'
}

/* ══════════════════════════════════════════
   LOGIN SCREEN
   ══════════════════════════════════════════ */
function LoginScreen() {
  const [mode, setMode]       = useState('login')
  const [email, setEmail]     = useState('')
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
        setMessage('Registrazione completata. Controlla la mail di conferma.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setMessage(err?.message || 'Operazione non riuscita.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">🏠</div>
        <h1 className="login-title">FamilyHub 2026</h1>
        <p className="login-subtitle">
          {mode === 'login' ? 'Accedi al tuo spazio famiglia' : 'Crea un nuovo account'}
        </p>

        <form onSubmit={submit}>
          <div className="fg">
            <label className="fl">Email</label>
            <input
              className="fi"
              type="email"
              placeholder="nome@esempio.it"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="fg">
            <label className="fl">Password</label>
            <input
              className="fi"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {message && <div className="error-msg">{message}</div>}

          <button
            className="btn btn-p"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: 4 }}
          >
            {loading ? '⏳ Attendere…' : mode === 'login' ? '🔐 Accedi' : '✅ Registrati'}
          </button>
        </form>

        <div className="login-switch">
          {mode === 'login' ? (
            <>Non hai un account?{' '}
              <button className="btn-link" onClick={() => { setMode('register'); setMessage('') }}>
                Registrati
              </button>
            </>
          ) : (
            <>Hai già un account?{' '}
              <button className="btn-link" onClick={() => { setMode('login'); setMessage('') }}>
                Accedi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN APP SHELL (autenticato)
   ══════════════════════════════════════════ */
function AppShell({ user }) {
  const [activePage, setActivePage] = useState('dashboard')
  const userInitials = getInitials(user?.email)
  const userEmail    = user?.email || ''

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const navigate = (key) => setActivePage(key)

  const renderPage = () => {
    switch (activePage) {
      case 'archivio': return <ArchivioPage />
      case 'salute':   return <SalutePage />
      case 'viaggi':   return <ViaggiPage />
      default:         return <DashboardPage onNavigate={navigate} />
    }
  }

  return (
    <AppProvider>
      <div className="app-shell">

        {/* ── SIDEBAR (desktop) ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-badge">🏠</div>
            <div>
              <div className="sidebar-app-name">FamilyHub</div>
              <div className="sidebar-app-sub">2026</div>
            </div>
          </div>

          <nav className="sidebar-nav-wrap">
            <ul className="sidebar-nav">
              {NAV_ITEMS.map(item => (
                <li key={item.key}>
                  <button
                    className={`nav-item ${item.cls} ${activePage === item.key ? 'active' : ''}`}
                    onClick={() => navigate(item.key)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{userInitials}</div>
              <div className="user-meta">
                <div className="user-name">{userInitials}</div>
                <div className="user-email">{userEmail}</div>
              </div>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              <span>🚪</span> Esci
            </button>
          </div>
        </aside>

        {/* ── MAIN AREA ── */}
        <main className="app-main">

          {/* Top bar mobile */}
          <header className="mobile-topbar">
            <div className="topbar-brand">
              <div className="topbar-badge">🏠</div>
              <div>
                <div className="topbar-title">FamilyHub</div>
                <div className="topbar-page-label">{PAGE_TITLES[activePage]}</div>
              </div>
            </div>
            <div className="topbar-actions">
              <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 11 }}>
                {userInitials}
              </div>
              <button className="icon-btn" onClick={handleLogout} title="Esci">
                🚪
              </button>
            </div>
          </header>

          {/* Contenuto pagina */}
          <div className="app-content">
            {renderPage()}
          </div>
        </main>

        {/* ── BOTTOM NAVIGATION (mobile) ── */}
        <nav className="bottom-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`bn-item ${item.cls} ${activePage === item.key ? 'active' : ''}`}
              onClick={() => navigate(item.key)}
            >
              <span className="bn-dot" />
              <span className="bn-icon">{item.icon}</span>
              <span className="bn-label">{item.label}</span>
            </button>
          ))}
        </nav>

      </div>
    </AppProvider>
  )
}

/* ══════════════════════════════════════════
   ROOT — Auth gate
   ══════════════════════════════════════════ */
export default function App() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span className="loading-text">Caricamento FamilyHub…</span>
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return <AppShell user={user} />
}
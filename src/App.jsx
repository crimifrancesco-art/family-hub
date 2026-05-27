import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { AppProvider } from './context/AppContext'
import DashboardPage from './pages/DashboardPage'
import ArchivioPage from './pages/ArchivioPage'
import SalutePage from './pages/SalutePage'
import ViaggiPage from './pages/ViaggiPage'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'ti ti-layout-dashboard' },
  { key: 'archivio', label: 'Archivio', icon: 'ti ti-folder' },
  { key: 'salute', label: 'Salute & Terapie', icon: 'ti ti-heartbeat' },
  { key: 'viaggi', label: 'Viaggi', icon: 'ti ti-plane' },
]

function Sidebar({ currentPage, setCurrentPage, sidebarOpen, mobileOpen, setMobileOpen }) {
  const goPage = (key) => {
    setCurrentPage(key)
    setMobileOpen(false)
  }

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark" />
          {sidebarOpen && (
            <div>
              <div className="logo-name">Family Hub</div>
              <div className="logo-tagline">drive care</div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => goPage(item.key)}
              title={item.label}
            >
              <i className={`nav-icon ${item.icon}`} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}

function Header({ title, sidebarOpen, setSidebarOpen, setMobileOpen, session, onLogout }) {
  return (
    <header className="header">
      <button className="hdr-toggle mobile-only" onClick={() => setMobileOpen(true)}>
        <i className="ti ti-menu-2" />
      </button>

      <button className="hdr-toggle desktop-only" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <i
          className={
            sidebarOpen
              ? 'ti ti-layout-sidebar-left-collapse'
              : 'ti ti-layout-sidebar-left-expand'
          }
        />
      </button>

      <div className="hdr-title">{title}</div>

      <div className="hdr-spacer" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>
          {session?.user?.email || ''}
        </span>
        <button className="btn ghost" onClick={onLogout}>
          Esci
        </button>
      </div>
    </header>
  )
}

function CurrentPage({ currentPage }) {
  if (currentPage === 'archivio') return <ArchivioPage />
  if (currentPage === 'salute') return <SalutePage />
  if (currentPage === 'viaggi') return <ViaggiPage />
  return <DashboardPage />
}

function LoginScreen({ email, password, setEmail, setPassword, message, onLogin }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f3f4f6',
        fontFamily: 'Inter, sans-serif',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#ffffff',
          borderRadius: 18,
          padding: 28,
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.10)',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 28, color: '#111827' }}>Family Hub</h1>
          <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 14 }}>
            Accedi per usare l’app collegata a Supabase
          </p>
        </div>

        <form onSubmit={onLogin} style={{ display: 'grid', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #d1d5db',
              fontSize: 15,
              outline: 'none',
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #d1d5db',
              fontSize: 15,
              outline: 'none',
            }}
          />

          <button
            type="submit"
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Accedi
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: 14,
              padding: '10px 12px',
              borderRadius: 10,
              background: '#fee2e2',
              color: '#b91c1c',
              fontSize: 14,
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 960) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
        setMobileOpen(false)
      }
    }

    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage('Errore login: ' + error.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setMobileOpen(false)
    setCurrentPage('dashboard')
    setMessage('')
  }

  const currentTitle = useMemo(() => {
    return NAV_ITEMS.find((item) => item.key === currentPage)?.label || 'Family Hub'
  }, [currentPage])

  if (loading) {
    return <div style={{ padding: 24 }}>Caricamento...</div>
  }

  if (!session) {
    return (
      <LoginScreen
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        message={message}
        onLogin={handleLogin}
      />
    )
  }

  return (
    <AppProvider>
      <div className={`app-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sidebarOpen={sidebarOpen}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <main className="main-area">
          <Header
            title={currentTitle}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            setMobileOpen={setMobileOpen}
            session={session}
            onLogout={handleLogout}
          />

          <div className="page-content">
            <CurrentPage currentPage={currentPage} />
          </div>
        </main>
      </div>
    </AppProvider>
  )
}

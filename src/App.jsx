import { useEffect, useState } from 'react'
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
          <div className="logo-mark">🏠</div>
          {sidebarOpen && (
            <div>
              <div className="logo-name">Family Hub</div>
              <div className="logo-tagline">drive & care</div>
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

function Header({ title, sidebarOpen, setSidebarOpen, setMobileOpen }) {
  return (
    <header className="header">
      <button className="hdr-toggle mobile-only" onClick={() => setMobileOpen(true)}>
        <i className="ti ti-menu-2" />
      </button>
      <button className="hdr-toggle desktop-only" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <i className={sidebarOpen ? 'ti ti-layout-sidebar-left-collapse' : 'ti ti-layout-sidebar-left-expand'} />
      </button>
      <div className="hdr-title">{title}</div>
      <div className="hdr-spacer" />
    </header>
  )
}

function CurrentPage({ currentPage }) {
  if (currentPage === 'archivio') return <ArchivioPage />
  if (currentPage === 'salute') return <SalutePage />
  if (currentPage === 'viaggi') return <ViaggiPage />
  return <DashboardPage />
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 960) {
        setSidebarOpen(true)
      }
      setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const currentTitle = NAV_ITEMS.find((item) => item.key === currentPage)?.label || 'Family Hub'

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
          />
          <div className="page-content">
            <CurrentPage currentPage={currentPage} />
          </div>
        </main>
      </div>
    </AppProvider>
  )
}

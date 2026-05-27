import { useState } from 'react'
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

function Sidebar({ currentPage, setCurrentPage, sidebarOpen }) {
  return (
    <aside className="sidebar">
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
            onClick={() => setCurrentPage(item.key)}
          >
            <i className={`nav-icon ${item.icon}`} />
            {sidebarOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  )
}

function Header({ title, sidebarOpen, setSidebarOpen }) {
  return (
    <header className="header">
      <button className="hdr-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <i className="ti ti-menu-2" />
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

  const currentTitle =
    NAV_ITEMS.find((item) => item.key === currentPage)?.label || 'Family Hub'

  return (
    <AppProvider>
      <div className="app-shell" data-sidebar={sidebarOpen ? 'open' : 'closed'}>
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sidebarOpen={sidebarOpen}
        />

        <main className="main-area">
          <Header
            title={currentTitle}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          <div className="page-content">
            <CurrentPage currentPage={currentPage} />
          </div>
        </main>
      </div>
    </AppProvider>
  )
}

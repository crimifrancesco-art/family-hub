import { useEffect, useMemo, useState } from 'react'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { key: 'salute', label: 'Salute', icon: '🩺' },
  { key: 'archivio', label: 'Archivio', icon: '🗂️' },
  { key: 'viaggi', label: 'Viaggi', icon: '✈️' },
]

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  salute: 'Salute',
  archivio: 'Archivio',
  viaggi: 'Viaggi',
}

function getInitialMobileOpen() {
  if (typeof window === 'undefined') return false
  return window.innerWidth > 768
}

export default function AppShell({
  currentPage,
  onNavigate,
  userEmail,
  onLogout,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(getInitialMobileOpen)

  const pageTitle = useMemo(
    () => PAGE_TITLES[currentPage] || 'Family Hub',
    [currentPage],
  )

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
      document.body.style.overflow = previousOverflow || ''
    }

    return () => {
      document.body.style.overflow = previousOverflow || ''
    }
  }, [sidebarOpen])

  const handleOpenSidebar = () => setSidebarOpen(true)
  const handleCloseSidebar = () => setSidebarOpen(false)

  const handleNavigate = (key) => {
    onNavigate?.(key)
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
    }
  }

  return (
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
            onClick={handleCloseSidebar}
            aria-label="Chiudi sidebar"
            title="Chiudi sidebar"
          >
            ✕
          </button>
        </div>

        <div className="sidebar-nav-wrap">
          <nav aria-label="Navigazione principale">
            <ul className="sidebar-nav">
              {NAV_ITEMS.map((item) => {
                const isActive = currentPage === item.key

                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavigate(item.key)}
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
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-meta">
              <div className="strong" style={{ fontSize: 14 }}>
                Account
              </div>
              <div className="user-email">{userEmail || 'Utente connesso'}</div>
            </div>
          </div>

          <button
            type="button"
            className="btn-logout"
            onClick={onLogout}
          >
            Esci
          </button>
        </div>
      </aside>

      <button
        type="button"
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        aria-label="Chiudi menu"
        onClick={handleCloseSidebar}
      />

      <div className="app-main">
        <div className="mobile-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="hamburger icon-btn"
              onClick={handleOpenSidebar}
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
              onClick={handleCloseSidebar}
              aria-label="Nascondi sidebar"
              title="Nascondi sidebar"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="desktop-toolbar">
          <div className="badge badge-dash">{pageTitle}</div>
        </div>

        <main className="app-content">{children}</main>
      </div>
    </div>
  )
}
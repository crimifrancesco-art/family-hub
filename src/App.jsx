import { useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import { AppProvider, useAppContext } from "./context/AppContext";
import DashboardPage from "./pages/DashboardPage";
import SalutePage from "./pages/SalutePage";
import ArchivioPage from "./pages/ArchivioPage";
import ViaggiPage from "./pages/ViaggiPage";

const TABS = [
  {
    key: "dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    icon: DashboardIcon,
    component: DashboardPage,
    description: "Panoramica generale della famiglia.",
  },
  {
    key: "salute",
    label: "Salute",
    shortLabel: "Salute",
    icon: HealthIcon,
    component: SalutePage,
    description: "Visite, terapie, farmaci e documenti sanitari.",
  },
  {
    key: "archivio",
    label: "Archivio",
    shortLabel: "Archivio",
    icon: ArchiveIcon,
    component: ArchivioPage,
    description: "Documenti e materiali condivisi.",
  },
  {
    key: "viaggi",
    label: "Viaggi",
    shortLabel: "Viaggi",
    icon: TravelIcon,
    component: ViaggiPage,
    description: "Piani viaggio, tappe e prenotazioni.",
  },
];

function DashboardIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      {...props}
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="2.2" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="2" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="2.2" />
      <rect x="3.5" y="12.5" width="7" height="8" rx="2.2" />
    </svg>
  );
}

function HealthIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      {...props}
    >
      <path d="M12 20.5s-6.8-4.55-9.05-8.13C1.18 9.56 2.18 5.9 5.4 4.5c2.2-.96 4.54-.2 6.1 1.78 1.56-1.98 3.9-2.74 6.1-1.78 3.22 1.4 4.22 5.06 2.45 7.87C18.8 15.95 12 20.5 12 20.5Z" />
      <path d="M8 12h2.2l1.2-2.4 2.2 4.8 1-2.4H17" />
    </svg>
  );
}

function ArchiveIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      {...props}
    >
      <rect x="3.5" y="4.5" width="17" height="4.5" rx="1.8" />
      <path d="M5.5 9h13v8.5a2.5 2.5 0 0 1-2.5 2.5h-8a2.5 2.5 0 0 1-2.5-2.5V9Z" />
      <path d="M10 13h4" />
    </svg>
  );
}

function TravelIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      {...props}
    >
      <path d="M21 16.5c0 .9-.7 1.5-1.6 1.5H4.6c-.9 0-1.6-.6-1.6-1.5 0-.44.18-.86.5-1.17l5.1-4.98V6.4c0-.77.63-1.4 1.4-1.4h4c.77 0 1.4.63 1.4 1.4v3.95l5.1 4.98c.32.31.5.73.5 1.17Z" />
      <path d="M9 18v1.4c0 .88.72 1.6 1.6 1.6h2.8c.88 0 1.6-.72 1.6-1.6V18" />
      <path d="M9.5 10.5h5" />
    </svg>
  );
}

function getUserDisplayName(user) {
  if (!user) return "";
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    user.email ||
    "Utente connesso"
  );
}

function getUserInitials(user) {
  const label = getUserDisplayName(user);
  if (!label) return "FH";

  const parts = label
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "FH";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function AuthGate() {
  const { session, authReady } = useAppContext();

  if (!authReady) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <FamilyHubShell />;
}

function AuthLoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at top left, rgba(37, 99, 235, 0.06), transparent 22%), radial-gradient(circle at top right, rgba(14, 165, 233, 0.05), transparent 20%), #f5f7fb",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 28,
          borderRadius: 28,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          background: "rgba(255, 255, 255, 0.92)",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            margin: "0 auto 16px",
            borderRadius: 16,
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
            color: "#fff",
            fontWeight: 800,
          }}
        >
          FH
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.03em",
          }}
        >
          Family Hub
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Controllo sessione in corso...
        </div>
      </div>
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const isRegister = mode === "register";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setAuthError("");
    setAuthMessage("");

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              name: fullName,
            },
          },
        });

        if (error) throw error;

        setAuthMessage(
          "Registrazione inviata. Controlla la mail di conferma se richiesta dal progetto Supabase.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (error) {
      setAuthError(error?.message || "Operazione non riuscita.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background:
          "radial-gradient(circle at top left, rgba(37, 99, 235, 0.06), transparent 22%), radial-gradient(circle at top right, rgba(14, 165, 233, 0.05), transparent 20%), #f5f7fb",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          padding: 28,
          borderRadius: 28,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          background: "rgba(255, 255, 255, 0.92)",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
              color: "#fff",
              boxShadow: "0 12px 26px rgba(37, 99, 235, 0.22)",
              flex: "0 0 auto",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              style={{ width: 24, height: 24 }}
            >
              <path d="M12 4.2 4.5 10v8.2a1 1 0 0 0 1 1h4.6v-5.1h3.8v5.1h4.6a1 1 0 0 0 1-1V10L12 4.2Z" />
            </svg>
          </div>

          <div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "#0f172a",
              }}
            >
              Family Hub
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 14,
                lineHeight: 1.45,
                color: "#64748b",
              }}
            >
              Accesso condiviso per salute, documenti e viaggi.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            padding: 6,
            borderRadius: 16,
            background: "rgba(37, 99, 235, 0.08)",
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setAuthError("");
              setAuthMessage("");
            }}
            style={{
              minHeight: 42,
              borderRadius: 12,
              border: "1px solid transparent",
              background: isRegister ? "transparent" : "#ffffff",
              color: isRegister ? "#475569" : "#2563eb",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setAuthError("");
              setAuthMessage("");
            }}
            style={{
              minHeight: 42,
              borderRadius: 12,
              border: "1px solid transparent",
              background: isRegister ? "#ffffff" : "transparent",
              color: isRegister ? "#2563eb" : "#475569",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          {isRegister ? (
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                Nome
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Nome e cognome"
                autoComplete="name"
                style={inputStyle}
              />
            </label>
          ) : null}

          <label style={{ display: "grid", gap: 6 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@dominio.it"
              autoComplete="email"
              required
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              style={inputStyle}
            />
          </label>

          {authError ? (
            <div
              style={{
                padding: "11px 12px",
                borderRadius: 14,
                border: "1px solid rgba(220, 38, 38, 0.18)",
                background: "rgba(248, 113, 113, 0.08)",
                color: "#b91c1c",
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              {authError}
            </div>
          ) : null}

          {authMessage ? (
            <div
              style={{
                padding: "11px 12px",
                borderRadius: 14,
                border: "1px solid rgba(37, 99, 235, 0.16)",
                background: "rgba(37, 99, 235, 0.08)",
                color: "#1d4ed8",
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              {authMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            style={{
              minHeight: 46,
              marginTop: 4,
              border: "1px solid transparent",
              borderRadius: 14,
              background: submitting ? "#93c5fd" : "#2563eb",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              cursor: submitting ? "wait" : "pointer",
              boxShadow: "0 14px 28px rgba(37, 99, 235, 0.18)",
            }}
          >
            {submitting
              ? "Attendere..."
              : isRegister
                ? "Crea account"
                : "Entra nel Family Hub"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  minHeight: 46,
  padding: "0 14px",
  borderRadius: 14,
  border: "1px solid rgba(15, 23, 42, 0.12)",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

function FamilyHubShell() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { signOut, user, authReady } = useAppContext();

  const activeTabConfig = useMemo(
    () => TABS.find((tab) => tab.key === activeTab) || TABS[0],
    [activeTab],
  );

  const ActivePage = activeTabConfig.component;
  const userDisplayName = getUserDisplayName(user);
  const userEmail = user?.email || "";
  const userInitials = getUserInitials(user);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setMobileNavOpen(false);
  };

  const handleSidebarClose = () => {
    setMobileNavOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileNavOpen(false);
  };

  return (
    <div
      className="fh-app-shell"
      style={{
        "--fh-bg": "#f5f7fb",
        "--fh-surface": "rgba(255, 255, 255, 0.88)",
        "--fh-surface-strong": "#ffffff",
        "--fh-line": "rgba(15, 23, 42, 0.08)",
        "--fh-line-strong": "rgba(15, 23, 42, 0.12)",
        "--fh-text": "#0f172a",
        "--fh-muted": "#64748b",
        "--fh-primary": "#2563eb",
        "--fh-primary-soft": "rgba(37, 99, 235, 0.10)",
        "--fh-primary-soft-2": "rgba(37, 99, 235, 0.16)",
        "--fh-shadow": "0 10px 30px rgba(15, 23, 42, 0.08)",
        "--fh-radius-xl": "24px",
        "--fh-radius-lg": "18px",
        "--fh-radius-md": "14px",
        "--fh-radius-sm": "12px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        html, body, #root {
          min-height: 100%;
        }
        body {
          margin: 0;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.06), transparent 22%),
            radial-gradient(circle at top right, rgba(14, 165, 233, 0.05), transparent 20%),
            var(--fh-bg);
          color: var(--fh-text);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        button, input, select, textarea {
          font: inherit;
        }
        .fh-app-shell {
          min-height: 100vh;
          padding: 18px;
        }
        .fh-layout {
          min-height: calc(100vh - 36px);
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 16px;
        }
        .fh-sidebar {
          position: sticky;
          top: 18px;
          height: calc(100vh - 36px);
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 18px;
          border: 1px solid var(--fh-line);
          border-radius: var(--fh-radius-xl);
          background: var(--fh-surface);
          backdrop-filter: blur(14px);
          box-shadow: var(--fh-shadow);
        }
        .fh-brand {
          display: grid;
          gap: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--fh-line);
        }
        .fh-brand-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .fh-brand-mark {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: linear-gradient(135deg, #2563eb, #0ea5e9);
          color: white;
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.22);
          flex: 0 0 auto;
        }
        .fh-brand-mark svg {
          width: 22px;
          height: 22px;
        }
        .fh-brand-copy {
          min-width: 0;
        }
        .fh-brand-title {
          font-size: 18px;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .fh-brand-subtitle {
          margin-top: 3px;
          color: var(--fh-muted);
          font-size: 13px;
          line-height: 1.35;
        }
        .fh-user-card {
          display: grid;
          grid-template-columns: 44px minmax(0, 1fr);
          gap: 12px;
          align-items: center;
          padding: 12px;
          border: 1px solid var(--fh-line);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.72);
        }
        .fh-user-avatar {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: var(--fh-primary-soft);
          border: 1px solid var(--fh-primary-soft-2);
          color: var(--fh-primary);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.04em;
        }
        .fh-user-copy {
          min-width: 0;
        }
        .fh-user-label {
          color: var(--fh-muted);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
        }
        .fh-user-name {
          margin-top: 3px;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.2;
          color: var(--fh-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fh-user-email {
          margin-top: 3px;
          color: var(--fh-muted);
          font-size: 12px;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fh-nav {
          display: grid;
          gap: 6px;
        }
        .fh-nav-section-label {
          padding: 6px 10px 2px;
          color: var(--fh-muted);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }
        .fh-nav-item {
          width: 100%;
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr);
          gap: 10px;
          align-items: center;
          text-align: left;
          padding: 11px 12px;
          border: 1px solid transparent;
          border-radius: 14px;
          background: transparent;
          color: var(--fh-text);
          cursor: pointer;
          transition: 180ms ease;
        }
        .fh-nav-item:hover {
          background: rgba(255, 255, 255, 0.7);
          border-color: var(--fh-line);
        }
        .fh-nav-item.is-active {
          background: var(--fh-primary-soft);
          border-color: var(--fh-primary-soft-2);
          box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.04);
        }
        .fh-nav-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid var(--fh-line);
          color: var(--fh-muted);
          transition: 180ms ease;
        }
        .fh-nav-item.is-active .fh-nav-icon {
          color: var(--fh-primary);
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(37, 99, 235, 0.14);
        }
        .fh-nav-icon svg {
          width: 20px;
          height: 20px;
        }
        .fh-nav-copy {
          min-width: 0;
        }
        .fh-nav-label {
          font-size: 14px;
          font-weight: 700;
          line-height: 1.2;
        }
        .fh-nav-desc {
          margin-top: 2px;
          color: var(--fh-muted);
          font-size: 12px;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fh-sidebar-foot {
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid var(--fh-line);
          color: var(--fh-muted);
          font-size: 12px;
          line-height: 1.45;
          display: grid;
          gap: 8px;
        }
        .fh-signout-btn {
          width: 100%;
          min-height: 36px;
          border-radius: 999px;
          border: 1px solid rgba(220, 38, 38, 0.16);
          background: rgba(248, 113, 113, 0.06);
          color: #b91c1c;
          font-size: 13px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: 160ms ease;
        }
        .fh-signout-btn:hover {
          background: rgba(248, 113, 113, 0.12);
          transform: translateY(-1px);
        }
        .fh-main {
          min-width: 0;
          display: grid;
          gap: 14px;
        }
        .fh-topbar {
          display: none;
        }
        .fh-page-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          border: 1px solid var(--fh-line);
          border-radius: var(--fh-radius-xl);
          background: var(--fh-surface);
          backdrop-filter: blur(14px);
          box-shadow: var(--fh-shadow);
        }
        .fh-page-kicker {
          color: var(--fh-muted);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }
        .fh-page-title {
          margin-top: 6px;
          font-size: 28px;
          line-height: 1.05;
          letter-spacing: -0.03em;
          font-weight: 800;
        }
        .fh-page-description {
          margin-top: 6px;
          color: var(--fh-muted);
          font-size: 14px;
          line-height: 1.45;
        }
        .fh-active-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 999px;
          background: var(--fh-primary-soft);
          color: var(--fh-primary);
          border: 1px solid var(--fh-primary-soft-2);
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }
        .fh-active-pill svg {
          width: 16px;
          height: 16px;
        }
        .fh-page-body {
          min-width: 0;
        }
        .fh-mobile-backdrop {
          display: none;
        }

        @media (max-width: 980px) {
          .fh-app-shell {
            padding: 12px;
          }
          .fh-layout {
            grid-template-columns: 1fr;
            min-height: auto;
          }
          .fh-sidebar {
            position: fixed;
            top: 12px;
            left: 12px;
            bottom: 12px;
            width: min(88vw, 320px);
            height: auto;
            z-index: 50;
            transform: translateX(-110%);
            transition: transform 220ms ease;
          }
          .fh-sidebar.is-open {
            transform: translateX(0);
          }
          .fh-mobile-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.35);
            backdrop-filter: blur(2px);
            z-index: 40;
          }
          .fh-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 14px 16px;
            border: 1px solid var(--fh-line);
            border-radius: 18px;
            background: var(--fh-surface-strong);
            box-shadow: var(--fh-shadow);
          }
          .fh-topbar-left {
            min-width: 0;
          }
          .fh-topbar-title {
            font-size: 16px;
            font-weight: 800;
            line-height: 1.15;
          }
          .fh-topbar-subtitle {
            margin-top: 3px;
            color: var(--fh-muted);
            font-size: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .fh-menu-btn {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            border: 1px solid var(--fh-line-strong);
            border-radius: 12px;
            background: white;
            color: var(--fh-text);
            cursor: pointer;
            flex: 0 0 auto;
          }
          .fh-menu-btn svg {
            width: 20px;
            height: 20px;
          }
          .fh-page-head {
            padding: 16px;
            border-radius: 18px;
            display: grid;
            gap: 10px;
          }
          .fh-page-title {
            font-size: 24px;
          }
          .fh-active-pill {
            justify-self: start;
          }
        }

        @media (max-width: 640px) {
          .fh-app-shell {
            padding: 10px;
          }
          .fh-page-head {
            padding: 14px;
          }
          .fh-page-title {
            font-size: 22px;
          }
          .fh-page-description {
            font-size: 13px;
          }
        }
      `}</style>

      {mobileNavOpen ? (
        <div className="fh-mobile-backdrop" onClick={handleSidebarClose} />
      ) : null}

      <div className="fh-layout">
        <aside
          className={`fh-sidebar ${mobileNavOpen ? "is-open" : ""}`}
          aria-label="Navigazione principale"
        >
          <div className="fh-brand">
            <div className="fh-brand-top">
              <div className="fh-brand-mark" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                >
                  <path d="M12 4.2 4.5 10v8.2a1 1 0 0 0 1 1h4.6v-5.1h3.8v5.1h4.6a1 1 0 0 0 1-1V10L12 4.2Z" />
                </svg>
              </div>
              <div className="fh-brand-copy">
                <div className="fh-brand-title">Family Hub</div>
                <div className="fh-brand-subtitle">
                  Spazio condiviso per salute, documenti e viaggi
                </div>
              </div>
            </div>

            <div className="fh-user-card">
              <div className="fh-user-avatar" aria-hidden="true">
                {authReady ? userInitials : "..."}
              </div>
              <div className="fh-user-copy">
                <div className="fh-user-label">Account connesso</div>
                <div className="fh-user-name">
                  {authReady ? userDisplayName : "Caricamento account..."}
                </div>
                <div className="fh-user-email">
                  {authReady ? userEmail || "Nessuna email disponibile" : ""}
                </div>
              </div>
            </div>
          </div>

          <nav className="fh-nav" aria-label="Sezioni app">
            <div className="fh-nav-section-label">Navigazione</div>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`fh-nav-item ${isActive ? "is-active" : ""}`}
                  onClick={() => handleTabChange(tab.key)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="fh-nav-icon" aria-hidden="true">
                    <Icon />
                  </div>
                  <div className="fh-nav-copy">
                    <div className="fh-nav-label">{tab.label}</div>
                    <div className="fh-nav-desc">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="fh-sidebar-foot">
            <div>
              Ordine coerente, etichette brevi e una sola gerarchia visuale tra
              tutte le schede.
            </div>
            <button
              type="button"
              className="fh-signout-btn"
              onClick={handleSignOut}
            >
              <span>Esci</span>
            </button>
          </div>
        </aside>

        <main className="fh-main">
          <div className="fh-topbar">
            <div className="fh-topbar-left">
              <div className="fh-topbar-title">Family Hub</div>
              <div className="fh-topbar-subtitle">
                {activeTabConfig.label}
              </div>
            </div>
            <button
              type="button"
              className="fh-menu-btn"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label={mobileNavOpen ? "Chiudi menu" : "Apri menu"}
              aria-expanded={mobileNavOpen}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
              >
                {mobileNavOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <>
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </>
                )}
              </svg>
            </button>
          </div>

          <div className="fh-page-head">
            <div>
              <div className="fh-page-kicker">Family Hub</div>
              <div className="fh-page-title">{activeTabConfig.label}</div>
              <div className="fh-page-description">
                {activeTabConfig.description}
              </div>
            </div>
            <div className="fh-active-pill">
              <activeTabConfig.icon />
              <span>{activeTabConfig.shortLabel}</span>
            </div>
          </div>

          <div className="fh-page-body">
            <ActivePage />
          </div>
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  return <AuthGate />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
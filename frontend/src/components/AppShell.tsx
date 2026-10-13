/**
 * AppShell.tsx — Master Application Shell for Syrax AI.
 * Provides sidebar navigation, responsive top bar, live system mode indicator,
 * workspace selector, user authentication modal, and routing.
 */
import React, { useState, useEffect } from "react";
import { getMeApi, loginApi, registerApi, clearStoredToken, UserProfile } from "../api";

export type NavView = "dashboard" | "new_analysis" | "explorer" | "reports" | "settings" | "workspace";

interface Props {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  children: React.ReactNode;
  demoMode?: boolean;
}

export default function AppShell({
  currentView,
  onNavigate,
  children,
  demoMode = true,
}: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authWorkspace, setAuthWorkspace] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const p = await getMeApi();
      setUserProfile(p);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      if (authMode === "login") {
        await loginApi(authEmail, authPassword);
      } else {
        await registerApi(authEmail, authPassword, authName || undefined, authWorkspace || undefined);
      }
      setShowAuthModal(false);
      setAuthPassword("");
      await loadUser();
      window.location.reload(); // Refresh data to reload workspace-scoped ideas
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    clearStoredToken();
    setUserProfile(null);
    loadUser();
    window.location.reload();
  }

  const navItems = [
    {
      id: "dashboard" as NavView,
      label: "Dashboard",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      id: "new_analysis" as NavView,
      label: "New Analysis",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      id: "explorer" as NavView,
      label: "Research Explorer",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      id: "reports" as NavView,
      label: "Saved Reports",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      id: "settings" as NavView,
      label: "System Status",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  function handleNav(id: NavView) {
    onNavigate(id);
    setMobileMenuOpen(false);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* ── Desktop Sidebar ────────────────────────────────────────── */}
      <aside
        style={{
          width: "260px",
          flexShrink: 0,
          background: "rgba(10, 14, 23, 0.85)",
          borderRight: "1px solid var(--border)",
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 40,
        }}
        className="hide-mobile"
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "1.75rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            cursor: "pointer",
          }}
          onClick={() => handleNav("dashboard")}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(0, 240, 255, 0.35)",
            }}
          >
            <span style={{ color: "#06080d", fontWeight: 900, fontSize: "1.1rem", fontFamily: "var(--font-mono)" }}>
              S
            </span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em", color: "#fff" }}>
                SYRAX
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontFamily: "var(--font-mono)",
                  padding: "0.15rem 0.35rem",
                  borderRadius: "4px",
                  background: "rgba(0, 240, 255, 0.12)",
                  color: "var(--accent-cyan)",
                  border: "1px solid rgba(0, 240, 255, 0.25)",
                }}
              >
                AI
              </span>
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              Project Intelligence
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: "1.25rem 1rem", display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1 }}>
          <div style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.5rem 0.75rem 0.25rem" }}>
            Platform Navigation
          </div>
          {navItems.map((item) => {
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  border: active ? "1px solid rgba(0, 240, 255, 0.3)" : "1px solid transparent",
                  background: active ? "rgba(0, 240, 255, 0.08)" : "transparent",
                  color: active ? "var(--accent-cyan)" : "var(--text-secondary)",
                  fontSize: "0.9rem",
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  textAlign: "left",
                }}
              >
                <span style={{ color: active ? "var(--accent-cyan)" : "var(--text-muted)" }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Workspace & User Pill at Sidebar Bottom */}
        <div style={{ padding: "1.25rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Workspace Pill */}
          <div
            style={{
              padding: "0.75rem 0.85rem",
              borderRadius: "var(--radius-md)",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Active Workspace
              </div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userProfile?.workspace_name || "Default Innovation Lab"}
              </div>
            </div>
          </div>

          {/* Mode Pill */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.2rem 0.4rem" }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: demoMode ? "var(--accent-amber)" : "var(--accent-emerald)",
                boxShadow: `0 0 8px ${demoMode ? "var(--accent-amber)" : "var(--accent-emerald)"}`,
              }}
            />
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {demoMode ? "Demo Mode Active" : "Live API Connected"}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main View Container ────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowX: "hidden" }}>
        {/* Top Navbar */}
        <header
          style={{
            height: "64px",
            borderBottom: "1px solid var(--border)",
            background: "rgba(6, 8, 13, 0.75)",
            backdropFilter: "blur(16px)",
            position: "sticky",
            top: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2rem",
          }}
        >
          {/* Left: Mobile hamburger & breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-icon show-mobile"
              style={{ padding: "0.5rem" }}
              aria-label="Toggle Navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>SYRAX</span>
              <span style={{ color: "var(--text-muted)" }}>/</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600, textTransform: "capitalize" }}>
                {currentView === "workspace" ? "Analysis Workspace" : currentView.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Right: Actions, Workspace, and Auth Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {currentView !== "new_analysis" && (
              <button
                onClick={() => handleNav("new_analysis")}
                className="btn btn-primary"
                style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>New Analysis</span>
              </button>
            )}

            {/* Auth / Workspace button */}
            {userProfile?.authenticated ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-primary)",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "100px",
                    background: "rgba(0, 240, 255, 0.08)",
                    border: "1px solid rgba(0, 240, 255, 0.25)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  👤 {userProfile.full_name || userProfile.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.72rem", padding: "0.3rem 0.6rem" }}
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}
              >
                Sign In / Switch Workspace
              </button>
            )}
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              position: "fixed",
              top: 64,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(6, 8, 13, 0.95)",
              backdropFilter: "blur(24px)",
              zIndex: 50,
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                  background: currentView === item.id ? "rgba(0, 240, 255, 0.1)" : "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border)",
                  color: currentView === item.id ? "var(--accent-cyan)" : "var(--text-primary)",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Auth Modal ──────────────────────────────────────────────── */}
        {showAuthModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(12px)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
            }}
            onClick={() => setShowAuthModal(false)}
          >
            <div
              className="glass-panel-elevated"
              style={{
                width: "100%",
                maxWidth: "420px",
                padding: "2rem",
                borderRadius: "var(--radius-lg)",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                  {authMode === "login" ? "Sign In to Workspace" : "Create Dedicated Workspace"}
                </h3>
                <button onClick={() => setShowAuthModal(false)} className="btn-icon" style={{ padding: "0.3rem" }}>
                  ✕
                </button>
              </div>

              {authError && (
                <div style={{ padding: "0.75rem", borderRadius: "6px", background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "var(--accent-rose)", fontSize: "0.82rem", marginBottom: "1rem" }}>
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {authMode === "register" && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        className="syrax-input"
                        placeholder="e.g. Alex Turing"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                        Workspace Name
                      </label>
                      <input
                        type="text"
                        className="syrax-input"
                        placeholder="e.g. Quantum Innovation Lab"
                        value={authWorkspace}
                        onChange={(e) => setAuthWorkspace(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="syrax-input"
                    required
                    placeholder="researcher@domain.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    className="syrax-input"
                    required
                    placeholder="••••••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={authLoading} className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
                  {authLoading ? "Authenticating..." : authMode === "login" ? "Sign In" : "Create Workspace"}
                </button>
              </form>

              <div style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {authMode === "login" ? (
                  <>
                    Need a new workspace?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("register")}
                      style={{ background: "none", border: "none", color: "var(--accent-cyan)", cursor: "pointer", fontWeight: 600 }}
                    >
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      style={{ background: "none", border: "none", color: "var(--accent-cyan)", cursor: "pointer", fontWeight: 600 }}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main style={{ flex: 1, padding: "2.5rem 2rem", maxWidth: "1400px", width: "100%", margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

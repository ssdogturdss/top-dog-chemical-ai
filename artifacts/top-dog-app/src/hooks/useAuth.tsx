import * as React from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  authenticated: boolean | null  // null = loading
  login: (password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  refetch: () => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = React.createContext<AuthState | null>(null)

// ---------------------------------------------------------------------------
// Provider — mount once at the app root
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = React.useState<boolean | null>(null)
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    fetch("/api/auth/status", { credentials: "include" })
      .then(r => r.json())
      .then((d: { authenticated: boolean }) => setAuthenticated(d.authenticated))
      .catch(() => setAuthenticated(false))
  }, [tick])

  const login = async (password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (r.ok) {
        setAuthenticated(true)
        return { ok: true }
      }
      const d = await r.json() as { error?: string }
      return { ok: false, error: d.error ?? "Login failed" }
    } catch {
      return { ok: false, error: "Network error" }
    }
  }

  const logout = async (): Promise<void> => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    setAuthenticated(false)
  }

  const refetch = () => setTick(t => t + 1)

  const value: AuthState = { authenticated, login, logout, refetch }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------------------------------------------------------------------------
// Hook — use anywhere inside <AuthProvider>
// ---------------------------------------------------------------------------

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}

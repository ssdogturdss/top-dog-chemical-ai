import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FlaskConical, Lock, Loader2, AlertTriangle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export default function Login() {
  const { login } = useAuth()
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError(null)
    const result = await login(password)
    setLoading(false)
    if (!result.ok) setError(result.error ?? "Login failed")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Brand header */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-14 h-14 bg-secondary text-primary flex items-center justify-center">
          <FlaskConical className="h-8 w-8" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="font-display font-black text-3xl tracking-tight leading-none uppercase">Top Dog</h1>
          <p className="text-xs font-mono font-bold tracking-widest text-primary uppercase">Chemical AI</p>
        </div>
      </div>

      <Card className="w-full max-w-sm rounded-none border-2 shadow-[4px_4px_0_0_hsl(var(--border))]">
        <CardHeader className="border-b-2 border-border bg-secondary text-secondary-foreground pb-4">
          <CardTitle className="flex items-center gap-2 font-display uppercase text-lg">
            <Lock className="h-5 w-5 text-primary" />
            Access Required
          </CardTitle>
          <p className="text-xs font-mono text-secondary-foreground/70 mt-1">
            Enter your operator password to access the field tools.
          </p>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Password</Label>
              <Input
                type="password"
                placeholder="Operator password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                className="rounded-none border-2"
                autoFocus
                data-testid="input-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 border-2 border-destructive bg-destructive/10 text-destructive text-sm font-mono">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!password.trim() || loading}
              data-testid="button-login"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating…</>
              ) : (
                <><Lock className="mr-2 h-4 w-4" /> Sign In</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs font-mono text-muted-foreground text-center max-w-xs">
        Top Dog Chemical AI — Field Operations Platform
      </p>
    </div>
  )
}

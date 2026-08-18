import * as React from "react"
import { Link, useLocation } from "wouter"
import { FlaskConical, BookOpen, Settings, LayoutDashboard, Droplet, MessageSquareText, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b-2 md:border-b-0 md:border-r-2 border-border bg-card flex flex-col z-10 shrink-0">
        <div className="p-6 border-b-2 border-border bg-secondary text-secondary-foreground flex items-center gap-3">
          <FlaskConical className="h-8 w-8 text-primary" strokeWidth={2.5} />
          <div>
            <h1 className="font-display font-black text-xl tracking-tight leading-none uppercase">Top Dog</h1>
            <p className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase">Chemical AI</p>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          <div className="text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase mb-2 px-4 mt-4">Field Tools</div>
          <NavLink href="/" active={location === "/"} icon={BookOpen}>Logbook</NavLink>
          <NavLink href="/dilution" active={location === "/dilution"} icon={Droplet}>Dilution Expert</NavLink>
          <NavLink href="/chat" active={location === "/chat"} icon={MessageSquareText}>AI Assistant</NavLink>
          
          <div className="text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase mb-2 px-4 mt-8">System</div>
          <NavLink href="/dashboard" active={location === "/dashboard"} icon={LayoutDashboard} disabled>Command Center</NavLink>
          <NavLink href="/settings" active={location === "/settings"} icon={Settings} disabled>Configuration</NavLink>
        </nav>

        <div className="p-4 border-t-2 border-border bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-sm flex items-center justify-center border-2 border-border shadow-[2px_2px_0_0_hsl(var(--border))]">
              <span className="font-display font-bold text-secondary-foreground">TD</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-sm truncate">Field Operator</p>
              <p className="text-xs text-muted-foreground font-mono truncate">Authenticated</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              data-testid="button-logout"
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border-2 border-transparent hover:border-destructive/20"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-[calc(100dvh-5rem)] md:min-h-screen overflow-hidden">
        {children}
      </main>
    </div>
  )
}

function NavLink({ 
  href, 
  active, 
  icon: Icon, 
  children,
  disabled
}: { 
  href: string
  active: boolean
  icon: React.ElementType
  children: React.ReactNode
  disabled?: boolean
}) {
  const content = (
    <>
      <Icon className="h-5 w-5 shrink-0" />
      <span className="font-bold">{children}</span>
    </>
  )

  const className = cn(
    "flex items-center gap-3 px-4 py-3 text-sm transition-all border-2",
    active 
      ? "bg-primary text-primary-foreground border-primary shadow-[4px_4px_0_0_hsl(var(--secondary))]" 
      : "border-transparent text-foreground hover:bg-accent hover:border-border",
    disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:border-transparent"
  )

  if (disabled) {
    return <div className={className}>{content}</div>
  }

  const testId = typeof children === 'string' ? `nav-${children.toLowerCase().replace(/\s+/g, '-')}` : 'nav-link';

  return (
    <Link href={href} className={className} data-testid={testId}>
      {content}
    </Link>
  )
}

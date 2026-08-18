import * as React from "react"
import { Layout } from "@/components/layout"
import { useListNotes, useGetNoteStats, useToggleNotePin, getListNotesQueryKey, getGetNoteStatsQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "wouter"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Pin, Search, Filter, AlertTriangle, FileText, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Home() {
  const [search, setSearch] = React.useState("")
  const [category, setCategory] = React.useState<string | undefined>()
  const queryClient = useQueryClient()

  // Debounce search to prevent excessive API calls
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: notes, isLoading, isError } = useListNotes({ 
    search: debouncedSearch || undefined, 
    category 
  })
  
  const { data: stats } = useGetNoteStats()
  
  const togglePin = useToggleNotePin()

  const handleTogglePin = (id: number) => {
    togglePin.mutate({ id }, {
      onSuccess: () => {
        // Invalidate both lists
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetNoteStatsQueryKey() })
      }
    })
  }

  const pinnedNotes = notes?.filter(n => n.pinned) || []
  const unpinnedNotes = notes?.filter(n => !n.pinned) || []

  return (
    <Layout>
      {/* Top action bar */}
      <div className="bg-card border-b-2 border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight">Logbook</h2>
          <p className="text-muted-foreground font-mono text-sm mt-1">Field operations and chemical adjustments.</p>
        </div>
        <Link href="/notes/new" className="inline-flex items-center justify-center whitespace-nowrap text-sm font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border-2 active:translate-y-1 active:shadow-none bg-primary text-primary-foreground border-primary shadow-[0_4px_0_0_hsl(var(--primary))] hover:brightness-110 h-12 px-6 py-2" data-testid="button-create-note">
          <Plus className="mr-2 h-5 w-5" /> New Entry
        </Link>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Entries" value={stats?.total ?? "-"} />
          <StatCard title="Pinned" value={stats?.pinned ?? "-"} />
          {stats?.categories.slice(0, 2).map(cat => (
            <StatCard key={cat.category} title={cat.category} value={cat.count} />
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-muted/50 p-4 border-2 border-border">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by ID, title, or content..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 bg-card"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <Button 
              variant={category === undefined ? "default" : "outline"}
              onClick={() => setCategory(undefined)}
              data-testid="filter-all"
            >
              All
            </Button>
            {stats?.categories.map(cat => (
              <Button 
                key={cat.category}
                variant={category === cat.category ? "default" : "outline"}
                onClick={() => setCategory(cat.category)}
                data-testid={`filter-${cat.category}`}
              >
                {cat.category}
              </Button>
            ))}
          </div>
        </div>

        {/* Notes Feed */}
        <div className="space-y-8">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full border-2 border-border" />
              <Skeleton className="h-40 w-full border-2 border-border" />
            </div>
          )}
          
          {isError && (
            <div className="p-8 border-2 border-destructive bg-destructive/10 text-destructive flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-12 w-12 mb-4" />
              <p className="font-bold text-lg">Communication Failure</p>
              <p className="text-sm font-mono mt-2">Could not retrieve logbook data from mainframe.</p>
            </div>
          )}

          {!isLoading && !isError && notes?.length === 0 && (
            <div className="p-12 border-2 border-dashed border-border flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="font-display font-bold text-2xl uppercase">No Entries Found</p>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                {search || category ? "Adjust your search parameters or clear filters." : "The logbook is empty. Create a new entry to get started."}
              </p>
            </div>
          )}

          {pinnedNotes.length > 0 && (
            <div>
              <h3 className="font-mono font-bold text-sm text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <Pin className="h-4 w-4 fill-current" /> Priority Logs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pinnedNotes.map(note => (
                  <NoteCard key={note.id} note={note} onTogglePin={handleTogglePin} />
                ))}
              </div>
            </div>
          )}

          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <h3 className="font-mono font-bold text-sm text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2 mt-8">
                  Standard Logs
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unpinnedNotes.map(note => (
                  <NoteCard key={note.id} note={note} onTogglePin={handleTogglePin} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

function StatCard({ title, value }: { title: string, value: number | string }) {
  return (
    <Card className="rounded-none border-t-4 border-t-primary">
      <CardContent className="p-4 sm:p-6">
        <p className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
        <p className="font-display font-black text-3xl sm:text-4xl">{value}</p>
      </CardContent>
    </Card>
  )
}

function NoteCard({ note, onTogglePin }: { note: any, onTogglePin: (id: number) => void }) {
  const date = new Date(note.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <Card className="flex flex-col group hover:-translate-y-1 transition-transform duration-200">
      <CardHeader className="pb-4 relative">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className="font-mono rounded-none">
            #{String(note.id).padStart(4, '0')}
          </Badge>
          <button 
            onClick={(e) => {
              e.preventDefault()
              onTogglePin(note.id)
            }}
            className={cn("p-2 border-2 transition-colors", note.pinned ? "border-primary text-primary bg-primary/10" : "border-transparent text-muted-foreground hover:border-border hover:bg-muted")}
            data-testid={`button-pin-${note.id}`}
          >
            <Pin className={cn("h-4 w-4", note.pinned && "fill-current")} />
          </button>
        </div>
        <CardTitle className="line-clamp-2 pr-8">{note.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground line-clamp-3 text-sm">{note.content}</p>
      </CardContent>
      <CardFooter className="pt-4 border-t-2 border-border/50 flex justify-between items-center bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
          <span className="text-xs font-bold uppercase">{note.category}</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{date}</span>
      </CardFooter>
      <Link href={`/notes/${note.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">View Note</span>
      </Link>
    </Card>
  )
}

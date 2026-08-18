import * as React from "react"
import { Layout } from "@/components/layout"
import { useCreateNote, getListNotesQueryKey, getGetNoteStatsQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { useLocation } from "wouter"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"

const CATEGORIES = [
  "Detergent",
  "Wax/Sealant",
  "Tire Shine",
  "Maintenance",
  "Water Quality",
  "Customer Issue",
  "Other"
]

export default function NoteNew() {
  const [, setLocation] = useLocation()
  const queryClient = useQueryClient()
  const createNote = useCreateNote()

  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [category, setCategory] = React.useState(CATEGORIES[0])
  const [error, setError] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError("Title is required")
      return
    }

    createNote.mutate({
      data: { title, content, category }
    }, {
      onSuccess: (newNote) => {
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetNoteStatsQueryKey() })
        setLocation(`/notes/${newNote.id}`)
      },
      onError: () => {
        setError("Failed to save entry. Check connection.")
      }
    })
  }

  return (
    <Layout>
      <div className="bg-card border-b-2 border-border p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-display text-2xl font-black uppercase tracking-tight">New Entry</h2>
        </div>
      </div>

      <div className="p-6 max-w-3xl mx-auto w-full">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="bg-muted/30">
            <CardTitle>Logbook Detail</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 border-2 border-destructive bg-destructive/10 text-destructive flex items-center gap-3 font-bold text-sm">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Title
                </label>
                <Input 
                  value={title}
                  onChange={e => { setTitle(e.target.value); setError(""); }}
                  placeholder="e.g., Presoak Titration Adjustment - Tunnel 2"
                  className="text-lg font-bold"
                  data-testid="input-title"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span> Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-2 border-2 text-sm font-bold uppercase transition-all active:translate-y-1 ${
                        category === cat 
                          ? 'border-primary bg-primary text-primary-foreground shadow-[0_4px_0_0_hsl(var(--primary))] hover:brightness-110' 
                          : 'border-border bg-card text-foreground shadow-[0_4px_0_0_hsl(var(--border))] hover:bg-muted'
                      }`}
                      data-testid={`category-${cat}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span> Field Notes
                </label>
                <Textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Detailed observations, measurements, or adjustments made..."
                  className="min-h-[250px] font-sans"
                  data-testid="input-content"
                />
              </div>

              <div className="pt-6 border-t-2 border-border flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={createNote.isPending}
                  className="w-full sm:w-auto"
                  data-testid="button-save"
                >
                  {createNote.isPending ? "Transmitting..." : (
                    <>
                      <Save className="mr-2 h-5 w-5" /> Save Entry
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

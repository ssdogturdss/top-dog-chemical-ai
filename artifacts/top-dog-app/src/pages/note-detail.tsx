import * as React from "react"
import { Layout } from "@/components/layout"
import { useGetNote, useUpdateNote, useDeleteNote, useToggleNotePin, getGetNoteQueryKey, getListNotesQueryKey, getGetNoteStatsQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { useLocation, useParams } from "wouter"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Trash2, Pin, Calendar, Clock, Edit3, Check, X, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  "Detergent",
  "Wax/Sealant",
  "Tire Shine",
  "Maintenance",
  "Water Quality",
  "Customer Issue",
  "Other"
]

export default function NoteDetail() {
  const params = useParams()
  const id = Number(params.id)
  const [, setLocation] = useLocation()
  const queryClient = useQueryClient()
  
  const [isEditing, setIsEditing] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState("")
  const [editContent, setEditContent] = React.useState("")
  const [editCategory, setEditCategory] = React.useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  const { data: note, isLoading, isError } = useGetNote(id, {
    query: { enabled: !!id, queryKey: getGetNoteQueryKey(id) }
  })

  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const togglePin = useToggleNotePin()

  // Initialize edit state when note loads
  React.useEffect(() => {
    if (note && !isEditing) {
      setEditTitle(note.title)
      setEditContent(note.content)
      setEditCategory(note.category)
    }
  }, [note, isEditing])

  if (isLoading) return <LoadingState />
  if (isError || !note) return <ErrorState />

  const handleSave = () => {
    if (!editTitle.trim()) return

    updateNote.mutate({
      id,
      data: { title: editTitle, content: editContent, category: editCategory }
    }, {
      onSuccess: (updatedData) => {
        // Patch cache directly to avoid refetch cascade
        queryClient.setQueryData(getGetNoteQueryKey(id), updatedData)
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetNoteStatsQueryKey() })
        setIsEditing(false)
      }
    })
  }

  const handleDelete = () => {
    deleteNote.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetNoteStatsQueryKey() })
        setLocation("/")
      }
    })
  }

  const handleTogglePin = () => {
    togglePin.mutate({ id }, {
      onSuccess: (updatedData) => {
        queryClient.setQueryData(getGetNoteQueryKey(id), updatedData)
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetNoteStatsQueryKey() })
      }
    })
  }

  const createdDate = new Date(note.createdAt)
  const updatedDate = new Date(note.updatedAt)

  return (
    <Layout>
      <div className="bg-card border-b-2 border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-black uppercase tracking-tight">Entry #{String(id).padStart(4, '0')}</h2>
              {note.pinned && <Badge variant="default" className="bg-primary"><Pin className="w-3 h-3 mr-1 fill-current" /> Pinned</Badge>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={handleTogglePin} data-testid="button-toggle-pin">
                <Pin className={cn("mr-2 h-4 w-4", note.pinned && "fill-current")} /> {note.pinned ? "Unpin" : "Pin"}
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(true)} data-testid="button-edit">
                <Edit3 className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} data-testid="button-delete">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => {
                setIsEditing(false)
                setEditTitle(note.title)
                setEditContent(note.content)
                setEditCategory(note.category)
              }} data-testid="button-cancel-edit">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateNote.isPending || !editTitle.trim()} data-testid="button-save-edit">
                <Check className="mr-2 h-4 w-4" /> {updateNote.isPending ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-t-4 border-t-secondary">
              <CardContent className="p-6 md:p-8 space-y-6">
                {isEditing ? (
                  <div className="space-y-6">
                    <Input 
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="text-2xl font-display font-bold h-14"
                      placeholder="Title"
                      data-testid="input-edit-title"
                    />
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setEditCategory(cat)}
                          className={`px-3 py-1.5 border-2 text-xs font-bold uppercase transition-all active:translate-y-0.5 ${
                            editCategory === cat 
                              ? 'border-primary bg-primary text-primary-foreground shadow-[0_2px_0_0_hsl(var(--primary))]' 
                              : 'border-border bg-card text-foreground shadow-[0_2px_0_0_hsl(var(--border))] hover:bg-muted'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <Textarea 
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="min-h-[300px] text-base"
                      placeholder="Content"
                      data-testid="input-edit-content"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <Badge variant="secondary" className="mb-4">{note.category}</Badge>
                      <h1 className="font-display text-4xl font-black tracking-tight leading-tight">{note.title}</h1>
                    </div>
                    <div className="prose prose-lg dark:prose-invert max-w-none font-sans whitespace-pre-wrap">
                      {note.content || <span className="text-muted-foreground italic">No detailed notes provided.</span>}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-muted-foreground border-b-2 border-border pb-2">Metadata</h3>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" /> Created
                  </div>
                  <p className="font-bold text-sm">
                    {createdDate.toLocaleDateString()}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {createdDate.toLocaleTimeString()}
                  </p>
                </div>

                <div className="space-y-1 pt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" /> Last Modified
                  </div>
                  <p className="font-bold text-sm">
                    {updatedDate.toLocaleDateString()}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {updatedDate.toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="border-destructive shadow-[8px_8px_0_0_hsl(var(--destructive))]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Are you sure you want to permanently delete this entry? This action cannot be undone and will be permanently removed from the logbook.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteNote.isPending} data-testid="button-confirm-delete">
              {deleteNote.isPending ? "Deleting..." : "Delete Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

function LoadingState() {
  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    </Layout>
  )
}

function ErrorState() {
  return (
    <Layout>
      <div className="p-12 flex flex-col items-center justify-center text-center h-full">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="font-display font-bold text-3xl uppercase">Record Not Found</h2>
        <p className="text-muted-foreground mt-2 max-w-md">The requested logbook entry does not exist or has been removed from the system.</p>
        <Button className="mt-6" onClick={() => window.history.back()}>Return to Logbook</Button>
      </div>
    </Layout>
  )
}

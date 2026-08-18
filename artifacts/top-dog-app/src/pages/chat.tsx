import * as React from "react"
import { Layout } from "@/components/layout"
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useGetOpenaiConversation,
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey,
  getGetOpenaiConversationQueryKey,
} from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MessageSquareText,
  Plus,
  Trash2,
  Send,
  AlertTriangle,
  Bot,
  User,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { OpenaiConversation, OpenaiMessage } from "@workspace/api-client-react"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiBase(): string {
  // In the browser the API calls go to /api/... relative to the page origin.
  return ""
}

async function streamMessage(
  conversationId: number,
  content: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  const url = `${getApiBase()}/api/openai/conversations/${conversationId}/messages`
  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
  } catch (err) {
    onError("Network error — could not reach the AI server.")
    return
  }

  if (!response.ok || !response.body) {
    onError(`Server error ${response.status}`)
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(line.slice(6))
          if (parsed.done) {
            onDone()
            return
          }
          if (parsed.error) {
            onError(parsed.error as string)
            return
          }
          if (parsed.content) {
            onChunk(parsed.content)
          }
        } catch {
          // ignore malformed SSE lines
        }
      }
    }
  }
  onDone()
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Chat() {
  const [activeConversationId, setActiveConversationId] = React.useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data: conversations, isLoading: convsLoading } = useListOpenaiConversations()
  const createConversation = useCreateOpenaiConversation()
  const deleteConversation = useDeleteOpenaiConversation()

  const handleNewConversation = async () => {
    const title = `Session ${new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })}`
    const conv = await createConversation.mutateAsync({ data: { title } })
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() })
    setActiveConversationId(conv.id)
  }

  const handleDeleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteConversation.mutateAsync({ id })
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() })
    if (activeConversationId === id) setActiveConversationId(null)
  }

  return (
    <Layout>
      <div className="flex flex-1 overflow-hidden min-h-0 h-full" style={{ height: "calc(100vh - 64px)" }}>
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r-2 border-border flex flex-col bg-card overflow-hidden">
          <div className="p-4 border-b-2 border-border">
            <Button
              className="w-full"
              onClick={handleNewConversation}
              disabled={createConversation.isPending}
              data-testid="button-new-conversation"
            >
              {createConversation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              New Session
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {convsLoading && (
              <div className="space-y-2 p-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-none" />
                ))}
              </div>
            )}

            {!convsLoading && (!conversations || conversations.length === 0) && (
              <div className="p-4 text-center text-muted-foreground">
                <MessageSquareText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-mono">No sessions yet.</p>
              </div>
            )}

            <div className="space-y-1">
              {conversations?.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  active={activeConversationId === conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  onDelete={e => handleDeleteConversation(conv.id, e)}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {activeConversationId ? (
            <ConversationView
              key={activeConversationId}
              conversationId={activeConversationId}
            />
          ) : (
            <EmptyState onNew={handleNewConversation} />
          )}
        </div>
      </div>
    </Layout>
  )
}

// ---------------------------------------------------------------------------
// Conversation list item
// ---------------------------------------------------------------------------
function ConversationItem({
  conversation,
  active,
  onClick,
  onDelete,
}: {
  conversation: OpenaiConversation
  active: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const date = new Date(conversation.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  return (
    <button
      onClick={onClick}
      data-testid={`conversation-${conversation.id}`}
      className={cn(
        "w-full text-left px-3 py-3 flex items-center justify-between gap-2 group transition-colors border-2",
        active
          ? "bg-primary/10 border-primary text-foreground"
          : "border-transparent hover:bg-muted hover:border-border text-muted-foreground hover:text-foreground"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{conversation.title}</p>
        <p className="text-xs font-mono text-muted-foreground mt-0.5">{date}</p>
      </div>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
        data-testid={`delete-conversation-${conversation.id}`}
        title="Delete"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/20">
      <div className="w-20 h-20 bg-secondary text-secondary-foreground flex items-center justify-center mb-6">
        <Bot className="h-10 w-10" />
      </div>
      <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-2">Top Dog AI</h3>
      <p className="text-muted-foreground text-sm max-w-sm font-mono mb-8 leading-relaxed">
        Your field chemical expert. Ask about dilution ratios, water chemistry, equipment troubleshooting, or SDS safety.
      </p>
      <Button onClick={onNew} data-testid="button-start-session">
        <Plus className="mr-2 h-4 w-4" /> Start a Session
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Active conversation view
// ---------------------------------------------------------------------------
interface StreamingMessage {
  role: "assistant"
  content: string
  streaming: boolean
}

function ConversationView({ conversationId }: { conversationId: number }) {
  const queryClient = useQueryClient()
  const [input, setInput] = React.useState("")
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [streamingMsg, setStreamingMsg] = React.useState<StreamingMessage | null>(null)
  const [streamError, setStreamError] = React.useState<string | null>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const { data: conversation, isLoading, isError } = useGetOpenaiConversation(conversationId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => { scrollToBottom() }, [conversation?.messages, streamingMsg?.content])

  const handleSend = async () => {
    const msg = input.trim()
    if (!msg || isStreaming) return

    setInput("")
    setStreamError(null)
    setIsStreaming(true)
    setStreamingMsg({ role: "assistant", content: "", streaming: true })

    await streamMessage(
      conversationId,
      msg,
      (chunk) => {
        setStreamingMsg(prev =>
          prev ? { ...prev, content: prev.content + chunk } : null
        )
      },
      () => {
        setIsStreaming(false)
        setStreamingMsg(null)
        // Refresh the conversation to persist the assistant message
        queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) })
        inputRef.current?.focus()
      },
      (err) => {
        setIsStreaming(false)
        setStreamingMsg(null)
        // Reload conversation in case a partial message was saved
        queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) })
        setStreamError(err)
        inputRef.current?.focus()
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const allMessages: (OpenaiMessage | StreamingMessage)[] = [
    ...(conversation?.messages ?? []),
    ...(streamingMsg ? [streamingMsg] : []),
  ]

  return (
    <>
      {/* Header */}
      <div className="bg-card border-b-2 border-border px-6 py-4 flex items-center gap-3 shrink-0">
        <Bot className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-display font-black uppercase text-sm tracking-wider">
            {conversation?.title ?? "Loading…"}
          </h3>
          <p className="text-xs font-mono text-muted-foreground">
            {conversation?.messages.length ?? 0} message{conversation?.messages.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className={cn("h-20 rounded-none", i % 2 === 0 ? "ml-12" : "mr-12")} />
            ))}
          </div>
        )}

        {isError && (
          <div className="p-8 border-2 border-destructive bg-destructive/10 text-destructive flex flex-col items-center text-center">
            <AlertTriangle className="h-10 w-10 mb-3" />
            <p className="font-bold">Could not load conversation</p>
          </div>
        )}

        {!isLoading && !isError && allMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60 py-20">
            <ChevronRight className="h-8 w-8 text-muted-foreground mb-3 rotate-90" />
            <p className="font-mono text-sm text-muted-foreground">Type a question below to begin.</p>
          </div>
        )}

        {allMessages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role as "user" | "assistant"}
            content={msg.content}
            streaming={"streaming" in msg ? msg.streaming : false}
          />
        ))}

        {streamError && (
          <div className="p-4 border-2 border-destructive bg-destructive/10 text-destructive text-sm font-mono flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {streamError}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-card border-t-2 border-border p-4 shrink-0">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about dilution ratios, water chemistry, equipment…"
            disabled={isStreaming || isLoading}
            className="flex-1 rounded-none border-2"
            data-testid="input-message"
            autoFocus
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || isLoading}
            data-testid="button-send"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs font-mono text-muted-foreground text-center mt-2">
          Press Enter to send · Shift+Enter for newline
        </p>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------
function MessageBubble({
  role,
  content,
  streaming,
}: {
  role: "user" | "assistant"
  content: string
  streaming?: boolean
}) {
  const isUser = role === "user"

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 shrink-0 flex items-center justify-center border-2 border-border",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[75%] px-4 py-3 border-2 border-border text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-primary/10 border-primary/30 ml-auto"
            : "bg-card"
        )}
      >
        {content || (streaming && (
          <span className="inline-flex gap-1 items-center text-muted-foreground">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        ))}
        {streaming && content && (
          <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { toast } from 'sonner'
import { ArrowUp, Sparkles, SlidersHorizontal } from 'lucide-react'
import { createMood } from '@/app/actions/app'
import { neutralStats } from '@/lib/catalog'
import { MoodIcon } from '@/components/mood-icon'
import { StatsBars } from '@/components/stats-bars'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Proposal = {
  toolCallId: string
  name: string
  icon: string
  summary: string
  weights: Record<string, number>
}

const STARTERS = [
  'Had a long week, want to switch my brain off',
  'Something to watch on a cozy night in',
  'I want a clever, mind-bending film',
  'Just went through a breakup',
]

function textOf(message: UIMessage): string {
  return (message.parts ?? [])
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

function latestProposal(messages: UIMessage[]): Proposal | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    for (const part of messages[i].parts ?? []) {
      const p = part as {
        type: string
        state?: string
        toolCallId?: string
        input?: unknown
      }
      if (p.type === 'tool-proposeMood' && p.state === 'input-available') {
        const input = p.input as Omit<Proposal, 'toolCallId'>
        return { toolCallId: p.toolCallId ?? String(i), ...input }
      }
    }
  }
  return null
}

export function MoodChat({
  onCreated,
}: {
  onCreated: (moodId: string) => void
}) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/mood-chat' }),
  })
  const [input, setInput] = useState('')
  const [nameDraft, setNameDraft] = useState('')
  const [draftKey, setDraftKey] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const proposal = latestProposal(messages)
  const busy = status === 'submitted' || status === 'streaming'

  // Keep the editable name in sync with the most recent proposal.
  useEffect(() => {
    if (proposal && proposal.toolCallId !== draftKey) {
      setNameDraft(proposal.name)
      setDraftKey(proposal.toolCallId)
    }
  }, [proposal, draftKey])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, busy])

  function submit(text: string) {
    const value = text.trim()
    if (!value || busy) return
    sendMessage({ text: value })
    setInput('')
  }

  async function handleCreateBasic() {
    if (creating) return
    setCreating(true)
    try {
      const moodId = await createMood({
        name: 'Basic',
        icon: 'sparkles',
        weights: neutralStats(),
      })
      onCreated(moodId)
    } catch {
      toast.error('Could not create that mood. Try again.')
      setCreating(false)
    }
  }

  async function handleCreate() {
    if (!proposal) return
    setCreating(true)
    try {
      const moodId = await createMood({
        name: nameDraft.trim() || proposal.name,
        icon: proposal.icon,
        weights: proposal.weights,
      })
      onCreated(moodId)
    } catch {
      toast.error('Could not create that mood. Try again.')
      setCreating(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 py-4">
        {/* Intro */}
        <div className="border border-foreground p-4">
          <p className="eyebrow">The Concierge</p>
          <p className="mt-2 text-pretty font-display text-xl font-bold leading-snug">
            Tell me how you feel and what you&apos;re in the mood for.
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Where are you, what vibe do you want, and anything you&apos;d rather
            avoid? I&apos;ll build you a mood.
          </p>
        </div>

        {messages.length === 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                className="border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                {s}
              </button>
            ))}

            <div className="mt-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="eyebrow">Or skip the chat</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              onClick={handleCreateBasic}
              disabled={creating}
              className="mt-1 flex items-center gap-3 border-2 border-foreground px-3 py-3 text-left transition-colors hover:bg-accent disabled:opacity-60"
            >
              <span className="flex size-9 shrink-0 items-center justify-center border border-foreground">
                <SlidersHorizontal className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-base font-bold leading-tight">
                  {creating ? 'Creating…' : 'Basic mood'}
                </span>
                <span className="block text-sm leading-snug text-muted-foreground">
                  Start balanced — every trait at 50 — and train it by swiping.
                </span>
              </span>
            </button>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-3">
          {messages.map((m) => {
            const text = textOf(m)
            if (!text) return null
            const isUser = m.role === 'user'
            return (
              <div
                key={m.id}
                className={cn(
                  'flex',
                  isUser ? 'justify-end' : 'justify-start',
                )}
              >
                <p
                  className={cn(
                    'max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed',
                    isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-card text-card-foreground',
                  )}
                >
                  {text}
                </p>
              </div>
            )
          })}

          {busy && !proposal && (
            <div className="flex justify-start">
              <p className="flex items-center gap-1.5 border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
                <span className="inline-flex gap-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </span>
                Thinking
              </p>
            </div>
          )}
        </div>

        {/* Proposal card */}
        {proposal && (
          <div className="mt-4 border-2 border-foreground bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Your mood</p>
              <Sparkles className="size-4" aria-hidden="true" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {proposal.summary}
            </p>

            <div className="mt-4 flex items-center gap-3 border-y border-border py-3">
              <span className="flex size-10 shrink-0 items-center justify-center border border-foreground">
                <MoodIcon name={proposal.icon} className="size-5" />
              </span>
              <label className="min-w-0 flex-1">
                <span className="eyebrow">Mood name</span>
                <Input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={40}
                  className="mt-1 h-9 rounded-none border-0 border-b border-foreground bg-transparent px-0 font-display text-lg font-bold focus-visible:ring-0"
                  aria-label="Mood name"
                />
              </label>
            </div>

            <div className="mt-4">
              <p className="eyebrow">Taste profile</p>
              <div className="mt-3">
                <StatsBars stats={proposal.weights} />
              </div>
            </div>

            <Button
              className="mt-5 h-12 w-full rounded-none text-sm font-semibold uppercase tracking-[0.18em]"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Creating…' : 'Create this mood'}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Not quite right? Keep chatting to refine it.
            </p>
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(input)
        }}
        className="flex items-center gap-2 border-t border-foreground bg-background pt-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={proposal ? 'Refine your mood…' : 'Type how you feel…'}
          className="h-11 flex-1 rounded-none border-foreground bg-transparent"
          aria-label="Message"
        />
        <Button
          type="submit"
          size="icon"
          className="size-11 shrink-0 rounded-none"
          disabled={busy || !input.trim()}
          aria-label="Send"
        >
          <ArrowUp className="size-5" aria-hidden="true" />
        </Button>
      </form>
    </div>
  )
}

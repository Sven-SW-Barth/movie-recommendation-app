'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { moods } from '@/lib/catalog'
import { completeOnboarding } from '@/app/actions/app'
import { MoodIcon } from '@/components/mood-icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Onboarding({ name }: { name: string }) {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const firstName = name?.split(' ')[0] ?? 'there'

  function handleContinue() {
    if (!selected) return
    startTransition(async () => {
      await completeOnboarding(selected)
      router.refresh()
    })
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col px-5 pb-28 pt-10">
      <div className="flex items-center justify-between border-b border-foreground pb-2">
        <span className="eyebrow">Reel Mood</span>
        <span className="eyebrow">The Mood Edit</span>
      </div>

      <header className="mt-8">
        <p className="eyebrow">Welcome, {firstName}</p>
        <h1 className="mt-3 text-balance font-display text-[2.75rem] font-bold leading-[0.92] tracking-tight">
          How do you want to{' '}
          <span className="italic font-medium">feel</span> tonight?
        </h1>
        <p className="mt-4 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
          Every mood is its own taste profile. Choose one to begin — you can
          train and switch between them anytime.
        </p>
      </header>

      <div className="mt-8 flex items-center justify-between border-b border-border pb-2">
        <span className="eyebrow">Select a mood</span>
        <span className="eyebrow">{moods.length} profiles</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-px bg-border">
        {moods.map((mood, i) => {
          const active = selected === mood.id
          return (
            <button
              key={mood.id}
              type="button"
              onClick={() => setSelected(mood.id)}
              aria-pressed={active}
              className={cn(
                'group relative flex flex-col gap-3 p-4 text-left transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'index-numeral text-lg',
                    active ? 'text-primary-foreground/60' : 'text-muted-foreground',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <MoodIcon name={mood.emoji} className="size-5" />
              </div>
              <span>
                <span className="block font-display text-lg font-bold leading-tight">
                  {mood.label}
                </span>
                <span
                  className={cn(
                    'mt-1 block text-xs leading-snug',
                    active
                      ? 'text-primary-foreground/80'
                      : 'text-muted-foreground',
                  )}
                >
                  {mood.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t border-foreground bg-background/95 p-4 backdrop-blur">
        <Button
          className="h-12 w-full rounded-none text-sm font-semibold uppercase tracking-[0.18em]"
          disabled={!selected || pending}
          onClick={handleContinue}
        >
          {pending ? 'Setting the mood…' : 'Start watching'}
        </Button>
      </div>
    </main>
  )
}

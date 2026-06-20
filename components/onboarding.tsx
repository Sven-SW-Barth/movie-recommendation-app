'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { moods } from '@/lib/catalog'
import { completeOnboarding } from '@/app/actions/app'
import { MoodIcon } from '@/components/mood-icon'
import { Button } from '@/components/ui/button'
import { Clapperboard } from 'lucide-react'
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
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col px-5 pb-28 pt-12">
      <div className="flex items-center gap-2 text-primary">
        <Clapperboard className="size-5" aria-hidden="true" />
        <span className="font-display text-sm font-semibold uppercase tracking-widest">
          Reel Mood
        </span>
      </div>

      <header className="mt-8">
        <h1 className="text-pretty font-display text-3xl font-bold leading-tight">
          Hi {firstName}, how do you want to feel tonight?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Each mood is its own taste profile. Pick one to start — you can train
          and switch between them anytime.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {moods.map((mood) => {
          const active = selected === mood.id
          return (
            <button
              key={mood.id}
              type="button"
              onClick={() => setSelected(mood.id)}
              aria-pressed={active}
              className={cn(
                'flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                active
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-accent',
              )}
            >
              <span
                className={cn(
                  'flex size-11 items-center justify-center rounded-xl',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground',
                )}
              >
                <MoodIcon name={mood.emoji} className="size-5" />
              </span>
              <span>
                <span className="block font-display text-base font-semibold">
                  {mood.label}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  {mood.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t border-border bg-background/90 p-4 backdrop-blur">
        <Button
          className="h-12 w-full text-base font-semibold"
          disabled={!selected || pending}
          onClick={handleContinue}
        >
          {pending ? 'Setting the mood…' : 'Start watching'}
        </Button>
      </div>
    </main>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { MoodChat } from '@/components/mood-chat'

export function Onboarding({ name }: { name: string }) {
  const router = useRouter()
  const firstName = name?.split(' ')[0] ?? 'there'

  return (
    <main className="mx-auto flex h-svh w-full max-w-md flex-col px-5 pb-4 pt-6">
      <div className="flex items-center justify-between border-b border-foreground pb-2">
        <span className="eyebrow">Reel Mood</span>
        <span className="eyebrow">The Mood Edit</span>
      </div>

      <header className="mt-5">
        <p className="eyebrow">Welcome, {firstName}</p>
        <h1 className="mt-2 text-balance font-display text-[2rem] font-bold leading-[0.95] tracking-tight">
          Let&apos;s find your{' '}
          <span className="italic font-medium">mood</span>.
        </h1>
      </header>

      <MoodChat onCreated={() => router.refresh()} />
    </main>
  )
}

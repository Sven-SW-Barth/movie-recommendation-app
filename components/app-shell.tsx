'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Clapperboard, LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import {
  getMoodSummaries,
  getUserState,
  recordSwipe,
  resetActiveMood,
  setActiveMood,
} from '@/app/actions/app'
import { getMood, getMovie } from '@/lib/catalog'
import { BottomNav, type TabId } from '@/components/bottom-nav'
import { MoodIcon } from '@/components/mood-icon'
import { RecommendTab } from '@/components/tabs/recommend-tab'
import { TrainTab } from '@/components/tabs/train-tab'
import { MoodsTab } from '@/components/tabs/moods-tab'
import { Button } from '@/components/ui/button'

type ShellState = {
  activeMood: string
  stats: Record<string, number>
  swipedMovieIds: string[]
}

export function AppShell({
  userName,
  initialState,
}: {
  userName: string
  initialState: ShellState
}) {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('train')
  const [state, setState] = useState<ShellState>(initialState)
  const [switching, startSwitch] = useTransition()

  const { data: summaries, mutate: mutateSummaries } = useSWR(
    'mood-summaries',
    () => getMoodSummaries(),
  )

  const activeMoodMeta = getMood(state.activeMood)

  async function handleSwipe(movieId: string, liked: boolean) {
    const movie = getMovie(movieId)
    // Optimistically advance the deck.
    setState((prev) => ({
      ...prev,
      swipedMovieIds: [...prev.swipedMovieIds, movieId],
    }))
    try {
      const res = await recordSwipe(movieId, liked)
      setState((prev) => ({ ...prev, stats: res.stats }))
      mutateSummaries()
      if (movie) {
        toast(liked ? `Liked · ${movie.title}` : `Skipped · ${movie.title}`, {
          duration: 1200,
        })
      }
    } catch {
      // Roll back on failure.
      setState((prev) => ({
        ...prev,
        swipedMovieIds: prev.swipedMovieIds.filter((id) => id !== movieId),
      }))
      toast.error('Could not save that swipe. Try again.')
    }
  }

  function handleSwitch(moodId: string) {
    startSwitch(async () => {
      try {
        await setActiveMood(moodId)
        const next = await getUserState()
        setState({
          activeMood: next.activeMood ?? moodId,
          stats: next.stats,
          swipedMovieIds: next.swipedMovieIds,
        })
        mutateSummaries()
        toast(`Switched to ${getMood(moodId)?.label}`, { duration: 1200 })
      } catch {
        toast.error('Could not switch moods.')
      }
    })
  }

  function handleReset() {
    startSwitch(async () => {
      try {
        await resetActiveMood()
        const next = await getUserState()
        setState({
          activeMood: next.activeMood ?? state.activeMood,
          stats: next.stats,
          swipedMovieIds: next.swipedMovieIds,
        })
        mutateSummaries()
        toast('Mood profile reset')
      } catch {
        toast.error('Could not reset this mood.')
      }
    })
  }

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <div className="mx-auto min-h-svh w-full max-w-md bg-background">
      <header className="sticky top-0 z-20 border-b border-foreground bg-background/90 backdrop-blur">
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <div className="flex items-center gap-2 text-primary">
            <Clapperboard className="size-4" aria-hidden="true" />
            <span className="font-display text-xl font-bold tracking-tight">
              Reel Mood
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 border border-foreground px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em]">
              <MoodIcon
                name={activeMoodMeta?.emoji ?? 'heart'}
                className="size-3.5"
              />
              {activeMoodMeta?.label}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-none text-muted-foreground"
              aria-label="Sign out"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      <main className="pb-24">
        {tab === 'recommend' && (
          <RecommendTab
            activeMood={state.activeMood}
            stats={state.stats}
            swipeCount={state.swipedMovieIds.length}
            onGoTrain={() => setTab('train')}
          />
        )}
        {tab === 'train' && (
          <TrainTab
            activeMood={state.activeMood}
            stats={state.stats}
            swipedMovieIds={state.swipedMovieIds}
            onSwipe={handleSwipe}
            onReset={handleReset}
          />
        )}
        {tab === 'moods' && (
          <MoodsTab
            activeMood={state.activeMood}
            stats={state.stats}
            summaries={summaries}
            switching={switching}
            onSwitch={handleSwitch}
            onReset={handleReset}
          />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Clapperboard, LogOut, X } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import {
  deleteMood,
  getUserMoods,
  getUserState,
  recordSwipe,
  resetActiveMood,
  setActiveMood,
} from '@/app/actions/app'
import { getMovie } from '@/lib/catalog'
import { BottomNav, type TabId } from '@/components/bottom-nav'
import { MoodIcon } from '@/components/mood-icon'
import { MoodChat } from '@/components/mood-chat'
import { RecommendTab } from '@/components/tabs/recommend-tab'
import { TrainTab } from '@/components/tabs/train-tab'
import { MoodsTab } from '@/components/tabs/moods-tab'
import { Button } from '@/components/ui/button'

type ShellState = {
  activeMood: string
  activeName: string
  activeIcon: string
  stats: Record<string, number>
  swipedMovieIds: string[]
}

export function AppShell({
  initialState,
}: {
  initialState: ShellState
}) {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('train')
  const [state, setState] = useState<ShellState>(initialState)
  const [switching, startSwitch] = useTransition()
  const [adding, setAdding] = useState(false)

  const { data: moods, mutate: mutateMoods } = useSWR('user-moods', () =>
    getUserMoods(),
  )

  // Prefer the freshest name/icon from the moods list once it loads.
  const activeMeta = useMemo(() => {
    const found = moods?.find((m) => m.moodId === state.activeMood)
    return {
      name: found?.name ?? state.activeName,
      icon: found?.icon ?? state.activeIcon,
    }
  }, [moods, state.activeMood, state.activeName, state.activeIcon])

  async function handleSwipe(movieId: string, liked: boolean) {
    const movie = getMovie(movieId)
    setState((prev) => ({
      ...prev,
      swipedMovieIds: [...prev.swipedMovieIds, movieId],
    }))
    try {
      const res = await recordSwipe(movieId, liked)
      setState((prev) => ({ ...prev, stats: res.stats }))
      mutateMoods()
      if (movie) {
        toast(liked ? `Liked · ${movie.title}` : `Passed · ${movie.title}`, {
          duration: 1200,
        })
      }
    } catch {
      setState((prev) => ({
        ...prev,
        swipedMovieIds: prev.swipedMovieIds.filter((id) => id !== movieId),
      }))
      toast.error('Could not save that swipe. Try again.')
    }
  }

  async function syncActive(fallbackMood: string) {
    const next = await getUserState()
    setState({
      activeMood: next.activeMood ?? fallbackMood,
      activeName: next.activeName ?? '',
      activeIcon: next.activeIcon ?? 'sparkles',
      stats: next.stats,
      swipedMovieIds: next.swipedMovieIds,
    })
  }

  function handleSwitch(moodId: string) {
    startSwitch(async () => {
      try {
        await setActiveMood(moodId)
        await syncActive(moodId)
        mutateMoods()
        const name = moods?.find((m) => m.moodId === moodId)?.name
        toast(name ? `Switched to ${name}` : 'Mood switched', {
          duration: 1200,
        })
      } catch {
        toast.error('Could not switch moods.')
      }
    })
  }

  function handleReset() {
    startSwitch(async () => {
      try {
        await resetActiveMood()
        await syncActive(state.activeMood)
        mutateMoods()
        toast('Mood profile reset')
      } catch {
        toast.error('Could not reset this mood.')
      }
    })
  }

  function handleDelete(moodId: string) {
    startSwitch(async () => {
      try {
        await deleteMood(moodId)
        await syncActive(state.activeMood)
        mutateMoods()
        toast('Mood deleted')
      } catch {
        toast.error('Could not delete this mood.')
      }
    })
  }

  async function handleCreated() {
    setAdding(false)
    await syncActive(state.activeMood)
    mutateMoods()
    setTab('train')
    toast('Mood created — start training')
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
            <span className="flex max-w-[10rem] items-center gap-1.5 border border-foreground px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em]">
              <MoodIcon name={activeMeta.icon} className="size-3.5 shrink-0" />
              <span className="truncate">{activeMeta.name}</span>
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
            moodName={activeMeta.name}
            moodIcon={activeMeta.icon}
            stats={state.stats}
            swipeCount={state.swipedMovieIds.length}
            onGoTrain={() => setTab('train')}
          />
        )}
        {tab === 'train' && (
          <TrainTab
            moodId={state.activeMood}
            moodName={activeMeta.name}
            stats={state.stats}
            swipedMovieIds={state.swipedMovieIds}
            onSwipe={handleSwipe}
            onReset={handleReset}
          />
        )}
        {tab === 'moods' && (
          <MoodsTab
            moods={moods}
            activeMood={state.activeMood}
            stats={state.stats}
            switching={switching}
            onSwitch={handleSwitch}
            onReset={handleReset}
            onAddMood={() => setAdding(true)}
            onDelete={handleDelete}
          />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />

      {adding && (
        <div className="fixed inset-0 z-30 mx-auto flex w-full max-w-md flex-col bg-background px-5 pb-4">
          <div className="flex items-center justify-between border-b border-foreground pb-2 pt-4">
            <span className="eyebrow">New mood</span>
            <button
              type="button"
              onClick={() => setAdding(false)}
              aria-label="Close"
              className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <header className="mt-4">
            <p className="eyebrow">The Concierge</p>
            <h1 className="mt-1.5 text-balance font-display text-[2rem] font-bold leading-[0.95] tracking-tight">
              Build a new <span className="italic font-medium">mood</span>.
            </h1>
          </header>
          <MoodChat onCreated={handleCreated} />
        </div>
      )}
    </div>
  )
}

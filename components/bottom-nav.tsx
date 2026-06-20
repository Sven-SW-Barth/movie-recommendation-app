'use client'

import { Sparkles, Layers, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabId = 'recommend' | 'train' | 'moods'

const TABS: { id: TabId; label: string; icon: typeof Sparkles }[] = [
  { id: 'recommend', label: 'For You', icon: Sparkles },
  { id: 'train', label: 'Train', icon: Layers },
  { id: 'moods', label: 'Moods', icon: SlidersHorizontal },
]

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId
  onChange: (tab: TabId) => void
}) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-border bg-background/90 backdrop-blur"
    >
      <ul className="flex items-stretch">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          const Icon = tab.icon
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex w-full flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {tab.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

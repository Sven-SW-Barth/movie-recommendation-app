import {
  Brain,
  Cloud,
  Coffee,
  Film,
  Flame,
  Heart,
  Laugh,
  Leaf,
  Moon,
  Pizza,
  Skull,
  Sparkles,
  Sun,
  Telescope,
  Zap,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  sun: Sun,
  laugh: Laugh,
  coffee: Coffee,
  heart: Heart,
  skull: Skull,
  brain: Brain,
  telescope: Telescope,
  sparkles: Sparkles,
  pizza: Pizza,
  moon: Moon,
  cloud: Cloud,
  zap: Zap,
  film: Film,
  flame: Flame,
  leaf: Leaf,
}

export function MoodIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = ICONS[name] ?? Heart
  return <Icon className={className} aria-hidden="true" />
}

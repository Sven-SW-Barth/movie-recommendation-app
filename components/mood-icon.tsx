import {
  Brain,
  Coffee,
  Heart,
  Laugh,
  Pizza,
  Skull,
  Sparkles,
  Sun,
  Telescope,
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

import {
  Brain,
  Castle,
  Coffee,
  Ghost,
  Heart,
  Zap,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  tea: Coffee,
  bolt: Zap,
  brain: Brain,
  ghost: Ghost,
  castle: Castle,
  heart: Heart,
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

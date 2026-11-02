import {
  Activity,
  Baby,
  Bone,
  Brain,
  Ear,
  Eye,
  HeartPulse,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

const icons: Record<string, LucideIcon> = {
  HeartPulse,
  Brain,
  Baby,
  Sparkles,
  Bone,
  Stethoscope,
  Eye,
  Ear,
  Activity,
}

export function DepartmentIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] || Stethoscope
  return <Icon aria-hidden className={cn('size-5', className)} />
}

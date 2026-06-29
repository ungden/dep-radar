import { CirclePlay, Instagram, Facebook } from "lucide-react"

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}

const PLATFORM_STYLES = {
  Youtube: {
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-100 dark:border-red-900/50",
  },
  Tiktok: {
    text: "text-slate-900 dark:text-slate-50",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700",
  },
  Instagram: {
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
    border: "border-fuchsia-100 dark:border-fuchsia-900/50",
  },
  Facebook: {
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-100 dark:border-blue-900/50",
  },
  default: {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-100 dark:border-rose-900/50",
  },
} as const

interface PlatformBadgeProps {
  platform: string
  size?: "sm" | "md"
}

export function PlatformBadge({ platform, size = "sm" }: PlatformBadgeProps) {
  const styles = PLATFORM_STYLES[platform as keyof typeof PLATFORM_STYLES] ?? PLATFORM_STYLES.default
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4"
  const textSize = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1"

  return (
    <span className={`inline-flex items-center gap-1 ${styles.text} ${styles.bg} ${textSize} rounded-full border ${styles.border} font-bold uppercase tracking-wider`}>
      {platform === "Tiktok" ? (
        <TikTokIcon className={iconSize} />
      ) : platform === "Instagram" ? (
        <Instagram className={iconSize} />
      ) : platform === "Facebook" ? (
        <Facebook className={iconSize} />
      ) : (
        <CirclePlay className={iconSize} />
      )}
      {platform}
    </span>
  )
}

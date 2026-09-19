"use client"

import { actions, useAct } from "@/lib/client-actions"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

export function FollowButton({ proId, className }: { proId: string; className?: string }) {
  const { followedPros, session } = useApp()
  const act = useAct()
  const following = followedPros.includes(proId)
  return (
    <button
      type="button"
      aria-pressed={following}
      onClick={() => {
        if (!session) {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
          return
        }
        void act(() => actions.toggleFollow(proId), following ? "Đã bỏ theo dõi" : "Đang theo dõi")
      }}
      className={cn(
        "h-9 shrink-0 rounded-full px-4 text-[13px] font-medium transition-colors",
        following ? "border border-line bg-surface text-ink-soft" : "bg-rose text-white hover:bg-rose-dark",
        className,
      )}
    >
      {following ? "Đang theo dõi" : "Theo dõi"}
    </button>
  )
}

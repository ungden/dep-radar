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
        // 40px to see, 48px to tap.
        "relative inline-flex h-10 shrink-0 items-center justify-center rounded-full px-5 text-[14px] font-semibold transition-[background-color,border-color,transform] duration-150 after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] active:scale-[0.98]",
        // Outline, not filled: on a profile the one filled button is "Đặt lịch".
        following ? "border border-transparent bg-subtle text-ink-soft hover:bg-subtle-strong" : "border border-accent bg-surface text-accent hover:bg-accent-soft",
        className,
      )}
    >
      {following ? "Đang theo dõi" : "Theo dõi"}
    </button>
  )
}

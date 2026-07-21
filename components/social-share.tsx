"use client"

import { useState } from "react"
import { Link2, Facebook, Share2 } from "lucide-react"

interface SocialShareProps {
  url: string
  title: string
}

export function SocialShare({ url, title }: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    )
  }

  function handleZalo() {
    window.open(
      `https://zalo.me/share?url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Chia sẻ:</span>
      <button
        onClick={handleCopy}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 relative"
        title="Sao chép link"
      >
        <Link2 className="h-4 w-4" />
        {copied && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-lg whitespace-nowrap">
            Đã sao chép!
          </span>
        )}
      </button>
      <button
        onClick={handleFacebook}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-blue-100 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
        title="Chia sẻ lên Facebook"
      >
        <Facebook className="h-4 w-4" />
      </button>
      <button
        onClick={handleZalo}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-blue-100 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
        title="Chia sẻ qua Zalo"
      >
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  )
}

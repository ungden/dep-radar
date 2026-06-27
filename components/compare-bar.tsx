"use client"

import * as React from "react"
import Link from "next/link"
import { X, Scale } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"

interface CompareItem {
  id: string
  name: string
}

const STORAGE_KEY = "compare_products"

function getCompareList(): CompareItem[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function setCompareList(items: CompareItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event("compare-updated"))
}

export function CompareBar() {
  const [items, setItems] = React.useState<CompareItem[]>([])

  React.useEffect(() => {
    const sync = () => setItems(getCompareList())
    sync()
    window.addEventListener("compare-updated", sync)
    return () => window.removeEventListener("compare-updated", sync)
  }, [])

  const remove = (id: string) => {
    setCompareList(items.filter((item) => item.id !== id))
  }

  const clearAll = () => {
    setCompareList([])
  }

  const compareUrl = `/compare?ids=${items.map((item) => item.id).join(",")}`

  return (
    <AnimatePresence>
      {items.length >= 2 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-xl rounded-t-2xl"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">
              <Scale className="h-4 w-4 text-rose-500" />
              So sánh ({items.length})
            </div>

            <div className="flex flex-wrap gap-2 flex-1 justify-center sm:justify-start">
              {items.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full text-xs font-medium max-w-[160px]"
                >
                  <span className="truncate">{item.name}</span>
                  <button
                    onClick={() => remove(item.id)}
                    className="shrink-0 hover:text-rose-500 transition-colors"
                    aria-label={`Xóa ${item.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500"
              >
                Xóa tất cả
              </Button>
              <Button asChild size="sm" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">
                <Link href={compareUrl}>So sánh ngay</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

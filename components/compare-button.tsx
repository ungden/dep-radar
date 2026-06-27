"use client"

import * as React from "react"
import { Scale } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CompareItem {
  id: string
  name: string
}

const STORAGE_KEY = "compare_products"
const MAX_ITEMS = 4

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

interface CompareButtonProps {
  productId: string
  productName: string
}

export function CompareButton({ productId, productName }: CompareButtonProps) {
  const [isSelected, setIsSelected] = React.useState(false)

  React.useEffect(() => {
    const sync = () => {
      const list = getCompareList()
      setIsSelected(list.some((item) => item.id === productId))
    }
    sync()
    window.addEventListener("compare-updated", sync)
    return () => window.removeEventListener("compare-updated", sync)
  }, [productId])

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const list = getCompareList()
    if (isSelected) {
      setCompareList(list.filter((item) => item.id !== productId))
    } else {
      if (list.length >= MAX_ITEMS) return
      setCompareList([...list, { id: productId, name: productName }])
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      className={`gap-1.5 text-xs ${
        isSelected
          ? "border-rose-400 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 dark:border-rose-500 dark:text-rose-400 dark:hover:bg-rose-950/50"
          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
      }`}
    >
      <Scale className="h-3.5 w-3.5" />
      {isSelected ? "Đã chọn" : "So sánh"}
    </Button>
  )
}

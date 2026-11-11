import * as React from "react"
import { useFocusEffect } from "expo-router"
import { supabase } from "@/data/supabase"

/**
 * Where the partner profile's review stands (20260929100000): '' while
 * loading or on a database without the columns, else draft / pending /
 * approved / changes_requested / rejected. Re-read when the screen gains focus.
 */
export function usePartnerReview(uid: string | null) {
  const [review, setReview] = React.useState<{ status: string; note: string } | null>(null)
  useFocusEffect(
    React.useCallback(() => {
      if (!uid) return
      let live = true
      void supabase
        .from("pros")
        .select("review_status, review_note")
        .eq("id", uid)
        .maybeSingle()
        .then(({ data }) => {
          if (live && data) setReview({ status: String(data.review_status ?? ""), note: String(data.review_note ?? "") })
        })
      return () => {
        live = false
      }
    }, [uid]),
  )
  return review
}

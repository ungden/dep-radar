"use client"

import * as React from "react"
import { fetchPartnerSetup } from "@/lib/api/actions"

/**
 * Whether the signed-in freelancer's saved week has at least one window. Read
 * from the database, not from the editor's defaults: the publish guard checks
 * the same table. `null` while loading.
 */
export function useSavedHours(): [boolean | null, (value: boolean) => void] {
  const [saved, setSaved] = React.useState<boolean | null>(null)
  React.useEffect(() => {
    let live = true
    void fetchPartnerSetup()
      .then((setup) => live && setSaved(Boolean(setup.profile?.hours_confirmed && setup.hours.length)))
      .catch(() => live && setSaved(false))
    return () => {
      live = false
    }
  }, [])
  return [saved, setSaved]
}

export { PartnerProgress as PublishProgress } from "./partner-progress"

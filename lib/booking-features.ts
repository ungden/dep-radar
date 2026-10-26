/** Public launch settings refresh without a new binary. Network failures keep the
 * last confirmed UI state; database guards remain authoritative for every write. */
export function watchStudioBookingSetting(input: {
  read: () => Promise<boolean | null>
  onChange: (open: boolean) => void
  isActive: () => boolean
  subscribeFocus: (sync: () => void) => () => void
}) {
  let live = true
  let inFlight = false
  const sync = async () => {
    if (!live || inFlight || !input.isActive()) return
    inFlight = true
    try {
      const open = await input.read()
      if (live && typeof open === "boolean") input.onChange(open)
    } catch { /* Retain the last successful read while offline. */ }
    finally { inFlight = false }
  }
  void sync()
  const timer = setInterval(() => void sync(), 60_000)
  const unsubscribe = input.subscribeFocus(() => void sync())
  return () => { live = false; clearInterval(timer); unsubscribe() }
}

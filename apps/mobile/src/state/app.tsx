import * as React from "react"
import * as SecureStore from "expo-secure-store"
import * as WebBrowser from "expo-web-browser"
import { makeRedirectUri } from "expo-auth-session"
import type { Session } from "@supabase/supabase-js"
import { travelDistanceKm } from "@/shared"
import { switchRole as writeRole } from "@/data/actions"
import { emptyMe, loadMe, type MeData } from "@/data/me"
import { loadPublic, type AppPro, type PublicData } from "@/data/public"
import { backendConfigured, supabase } from "@/data/supabase"

WebBrowser.maybeCompleteAuthSession()

const CITY_KEY = "dep360_city"

interface AppState {
  /** False until the stored session has been read. */
  ready: boolean
  configured: boolean
  session: Session | null
  uid: string | null
  data: PublicData | null
  dataError: string | null
  loading: boolean
  me: MeData
  /** The signed-in person's own freelancer profile, published or not. */
  myPro: AppPro | null
  mode: "customer" | "pro"
  /** Which city the customer browses; null is the whole country. */
  city: string | null
  setCity: (city: string | null) => void
  refresh: () => Promise<void>
  refreshMe: () => Promise<void>
  signInWithGoogle: () => Promise<{ ok: true; needsPhone: boolean } | { ok: false; error: string | null }>
  signOut: () => Promise<void>
  switchMode: (mode: "customer" | "pro") => Promise<void>
  /** Optimistic updates after a write succeeded. */
  patchMe: (fn: (me: MeData) => MeData) => void
  /** Road distance from the customer's default address; null when they have none. */
  distanceTo: (pro: Pick<AppPro, "city" | "district">) => number | null
}

const Ctx = React.createContext<AppState | null>(null)

export function useApp() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("useApp outside AppProvider")
  return ctx
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(!backendConfigured)
  const [session, setSession] = React.useState<Session | null>(null)
  const [data, setData] = React.useState<PublicData | null>(null)
  const [dataError, setDataError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [me, setMe] = React.useState<MeData>(emptyMe)
  const [city, setCityState] = React.useState<string | null>(null)
  const uid = session?.user.id ?? null
  const email = session?.user.email ?? ""

  React.useEffect(() => {
    SecureStore.getItemAsync(CITY_KEY)
      .then((v) => setCityState(v || null))
      .catch(() => {})
    if (!backendConfigured) return
    supabase.auth.getSession().then(({ data: s }) => {
      setSession(s.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const setCity = React.useCallback((next: string | null) => {
    setCityState(next)
    void (next ? SecureStore.setItemAsync(CITY_KEY, next) : SecureStore.deleteItemAsync(CITY_KEY)).catch(() => {})
  }, [])

  const refreshMe = React.useCallback(async () => {
    if (!uid) {
      setMe(emptyMe)
      return
    }
    try {
      setMe(await loadMe(uid, email))
    } catch {
      // Keep what we had; the next refresh tries again.
    }
  }, [uid, email])

  const refresh = React.useCallback(async () => {
    if (!backendConfigured) return
    setLoading(true)
    try {
      const [pub] = await Promise.all([loadPublic(uid), refreshMe()])
      setData(pub)
      setDataError(null)
    } catch (e) {
      setDataError(e instanceof Error ? e.message : "Không tải được dữ liệu.")
    } finally {
      setLoading(false)
    }
  }, [uid, refreshMe])

  React.useEffect(() => {
    if (ready) void refresh()
  }, [ready, refresh])

  // Unread counts follow new messages and notifications as they arrive.
  React.useEffect(() => {
    if (!uid) return
    const channel = supabase
      .channel(`me:${uid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => void refreshMe())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `account_id=eq.${uid}` }, () => void refreshMe())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [uid, refreshMe])

  const signInWithGoogle = React.useCallback(async (): Promise<{ ok: true; needsPhone: boolean } | { ok: false; error: string | null }> => {
    if (!backendConfigured) return { ok: false, error: "App chưa được cấu hình máy chủ." }
    // Must be listed under Supabase Auth > Redirect URLs (dep360://auth/callback is).
    const redirectTo = makeRedirectUri({ scheme: "dep360", path: "auth/callback" })
    const { data: oauth, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
    })
    if (error || !oauth.url) return { ok: false, error: "Đăng nhập Google chưa khả dụng. Thử lại sau nhé." }
    const result = await WebBrowser.openAuthSessionAsync(oauth.url, redirectTo)
    if (result.type !== "success") return { ok: false, error: null }
    const url = new URL(result.url)
    const code = url.searchParams.get("code")
    if (!code) return { ok: false, error: "Chưa đăng nhập được bằng Google. Thử lại nhé." }
    const { data: exchanged, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError || !exchanged.user) return { ok: false, error: "Chưa đăng nhập được bằng Google. Thử lại nhé." }
    const { data: account } = await supabase.from("accounts").select("phone").eq("id", exchanged.user.id).maybeSingle()
    return { ok: true, needsPhone: !(account as { phone?: string } | null)?.phone }
  }, [])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    setMe(emptyMe)
  }, [])

  const myPro = React.useMemo(() => (uid ? (data?.pros.find((p) => p.uuid === uid) ?? null) : null), [uid, data])
  const mode: "customer" | "pro" = me.account?.activeRole === "pro" && myPro ? "pro" : "customer"

  const switchMode = React.useCallback(
    async (next: "customer" | "pro") => {
      if (!uid) return
      await writeRole(uid, next)
      setMe((m) => (m.account ? { ...m, account: { ...m.account, activeRole: next } } : m))
    },
    [uid],
  )

  const home = me.addresses.find((a) => a.isDefault) ?? me.addresses[0] ?? null
  const distanceTo = React.useCallback(
    (pro: Pick<AppPro, "city" | "district">) => (home ? travelDistanceKm(home.city, home.district, pro.city, pro.district) : null),
    [home],
  )

  const value: AppState = {
    ready,
    configured: backendConfigured,
    session,
    uid,
    data,
    dataError,
    loading,
    me,
    myPro,
    mode,
    city,
    setCity,
    refresh,
    refreshMe,
    signInWithGoogle,
    signOut,
    switchMode,
    patchMe: (fn) => setMe((m) => fn(m)),
    distanceTo,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Resolve a URL slug or database id to a freelancer. */
export function usePro(id: string | undefined) {
  const { data } = useApp()
  return React.useMemo(() => data?.pros.find((p) => p.id === id || p.uuid === id) ?? null, [data, id])
}

import * as React from "react"
import * as AppleAuthentication from "expo-apple-authentication"
import * as Crypto from "expo-crypto"
import * as SecureStore from "expo-secure-store"
import * as WebBrowser from "expo-web-browser"
import { makeRedirectUri } from "expo-auth-session"
import type { Session } from "@supabase/supabase-js"
import { travelDistanceKm } from "@/shared"
import { switchRole as writeRole } from "@/data/actions"
import { readCache, writeCache } from "@/data/cache"
import { myThreadIds } from "@/data/chat"
import { emptyMe, loadMe, type MeData } from "@/data/me"
import { loadOnePro, loadPublic, mergePublic, proOfWork, type AppPro, type PublicData } from "@/data/public"
import { forgetPushToken, registerPushToken } from "@/data/push"
import { blockUser, loadServerBlocks, readLocalBlocks, unblockUser, writeLocalBlocks } from "@/data/safety"
import { backendConfigured, supabase } from "@/data/supabase"
import { hasAcceptedTerms, rememberTerms } from "@/data/terms"

WebBrowser.maybeCompleteAuthSession()

const CITY_KEY = "dep360_city"

type SignInResult = { ok: true; needsPhone: boolean } | { ok: false; error: string | null }

interface AppState {
  /** False until the stored session and city have been read. */
  ready: boolean
  configured: boolean
  session: Session | null
  uid: string | null
  data: PublicData | null
  /** True while `data` belongs to another city than the one chosen (a switch is loading). */
  stale: boolean
  dataError: string | null
  /** When the network failed and a saved copy is on screen: when that copy was saved. */
  offlineSince: number | null
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
  /** Load a freelancer outside the current city (from a link) into `data`. */
  ensurePro: (slugOrId: string) => Promise<void>
  ensureWork: (slugOrId: string) => Promise<void>
  signInWithGoogle: () => Promise<SignInResult>
  signInWithApple: () => Promise<SignInResult>
  signOut: () => Promise<void>
  switchMode: (mode: "customer" | "pro") => Promise<void>
  /** Optimistic updates after a write succeeded. */
  patchMe: (fn: (me: MeData) => MeData) => void
  /** Road distance from the customer's default address; null when they have none. */
  distanceTo: (pro: Pick<AppPro, "city" | "district">) => number | null
  /** Account ids this person blocked: hidden everywhere on this phone. */
  blocked: ReadonlySet<string>
  block: (accountId: string) => Promise<{ ok: boolean; message: string }>
  unblock: (accountId: string) => Promise<void>
  /** null until read from the Keychain for the signed-in person. */
  termsAccepted: boolean | null
  acceptTerms: () => Promise<void>
}

const Ctx = React.createContext<AppState | null>(null)

export function useApp() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("useApp outside AppProvider")
  return ctx
}

const cityKey = (city: string | null) => city ?? "*"

async function needsPhone(uid: string) {
  const { data: account } = await supabase.from("accounts").select("phone").eq("id", uid).maybeSingle()
  return !(account as { phone?: string } | null)?.phone
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sessionReady, setSessionReady] = React.useState(!backendConfigured)
  const [cityReady, setCityReady] = React.useState(false)
  const [session, setSession] = React.useState<Session | null>(null)
  const [data, setData] = React.useState<PublicData | null>(null)
  const [dataFor, setDataFor] = React.useState<string | null>(null)
  const [dataError, setDataError] = React.useState<string | null>(null)
  const [offlineSince, setOfflineSince] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [me, setMe] = React.useState<MeData>(emptyMe)
  const [city, setCityState] = React.useState<string | null>(null)
  const [blocked, setBlocked] = React.useState<ReadonlySet<string>>(new Set())
  const [termsAccepted, setTermsAccepted] = React.useState<boolean | null>(null)
  const [threadsVersion, setThreadsVersion] = React.useState(0)
  const uid = session?.user.id ?? null
  const email = session?.user.email ?? ""
  const ready = sessionReady && cityReady

  React.useEffect(() => {
    SecureStore.getItemAsync(CITY_KEY)
      .then((v) => setCityState(v || null))
      .catch(() => {})
      .finally(() => setCityReady(true))
    if (!backendConfigured) return
    supabase.auth.getSession().then(({ data: s }) => {
      setSession(s.session)
      setSessionReady(true)
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

  // Only the latest load may write, so a slow answer for the old city cannot
  // replace the new one.
  const loadSeq = React.useRef(0)
  const refresh = React.useCallback(async () => {
    if (!backendConfigured) return
    const seq = ++loadSeq.current
    const key = cityKey(city)
    setLoading(true)
    void refreshMe()
    try {
      const pub = await loadPublic(uid, city)
      if (seq !== loadSeq.current) return
      setData(pub)
      setDataFor(key)
      setDataError(null)
      setOfflineSince(null)
      void writeCache(city, pub)
    } catch (e) {
      if (seq !== loadSeq.current) return
      const cached = await readCache(city)
      if (seq !== loadSeq.current) return
      if (cached) {
        setData(cached.data)
        setDataFor(key)
        setOfflineSince(cached.savedAt)
        setDataError(null)
      } else {
        setDataError(e instanceof Error ? e.message : "Không tải được dữ liệu.")
      }
    } finally {
      if (seq === loadSeq.current) setLoading(false)
    }
  }, [uid, city, refreshMe])

  // A saved copy paints the screen at once; the network replaces it.
  const dataForRef = React.useRef(dataFor)
  dataForRef.current = dataFor
  React.useEffect(() => {
    if (!ready || !backendConfigured) return
    let live = true
    const key = cityKey(city)
    void readCache(city).then((cached) => {
      // Only while the network has not answered for this city yet.
      if (!live || !cached || dataForRef.current === key) return
      setData(cached.data)
      setDataFor(key)
    })
    void refresh()
    return () => {
      live = false
    }
  }, [ready, refresh, city])

  const ensurePro = React.useCallback(async (slugOrId: string) => {
    try {
      const extra = await loadOnePro(slugOrId)
      if (extra) setData((d) => (d ? mergePublic(d, extra) : extra))
    } catch {
      // The screen keeps saying it could not find them.
    }
  }, [])
  const ensureWork = React.useCallback(
    async (slugOrId: string) => {
      const proId = await proOfWork(slugOrId).catch(() => null)
      if (proId) await ensurePro(proId)
    },
    [ensurePro],
  )

  // Unread counts follow new messages in the caller's own threads (filtered on
  // the server, not every message in the database) and their notifications.
  React.useEffect(() => {
    if (!uid) return
    let live = true
    let channel: ReturnType<typeof supabase.channel> | null = null
    void myThreadIds().then((ids) => {
      if (!live) return
      channel = supabase.channel(`me:${uid}:${threadsVersion}`)
      for (let i = 0; i < ids.length; i += 100) {
        const part = ids.slice(i, i + 100)
        channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=in.(${part.join(",")})` }, () => void refreshMe())
      }
      // A new conversation: listen to it too.
      const bump = () => {
        void refreshMe()
        setThreadsVersion((v) => v + 1)
      }
      channel
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "threads", filter: `customer_id=eq.${uid}` }, bump)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "threads", filter: `pro_id=eq.${uid}` }, bump)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `account_id=eq.${uid}` }, () => void refreshMe())
        .subscribe()
    })
    return () => {
      live = false
      if (channel) void supabase.removeChannel(channel)
    }
  }, [uid, refreshMe, threadsVersion])

  // Per person: blocks, terms, and this phone's push token.
  React.useEffect(() => {
    if (!uid) {
      setBlocked(new Set())
      setTermsAccepted(null)
      return
    }
    let live = true
    void Promise.all([readLocalBlocks(uid), loadServerBlocks(uid)]).then(([local, server]) => {
      if (live) setBlocked(new Set([...local, ...server]))
    })
    void hasAcceptedTerms(uid).then((v) => live && setTermsAccepted(v))
    void registerPushToken(uid)
    return () => {
      live = false
    }
  }, [uid])

  const acceptTerms = React.useCallback(async () => {
    setTermsAccepted(true)
    if (uid) await rememberTerms(uid)
  }, [uid])

  const block = React.useCallback(
    async (accountId: string) => {
      if (!uid) return { ok: false, message: "Cần đăng nhập." }
      const next = new Set(blocked)
      next.add(accountId)
      setBlocked(next)
      await writeLocalBlocks(uid, [...next])
      const res = await blockUser(accountId)
      if (res.ok) return { ok: true, message: "Đã chặn. Bạn sẽ không thấy người này nữa." }
      // TODO(db): until block_user exists the block lives on this phone only.
      return {
        ok: true,
        message: res.missing ? "Đã ẩn người này trên máy bạn. Chặn trên tài khoản sẽ có khi máy chủ cập nhật." : "Đã ẩn người này trên máy bạn.",
      }
    },
    [uid, blocked],
  )

  const unblock = React.useCallback(
    async (accountId: string) => {
      if (!uid) return
      const next = new Set(blocked)
      next.delete(accountId)
      setBlocked(next)
      await writeLocalBlocks(uid, [...next])
      await unblockUser(accountId)
    },
    [uid, blocked],
  )

  const signInWithGoogle = React.useCallback(async (): Promise<SignInResult> => {
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
    return { ok: true, needsPhone: await needsPhone(exchanged.user.id) }
  }, [])

  /**
   * Sign in with Apple, required by App Store 4.8 next to Google. The native
   * sheet returns an identity token signed by Apple; Supabase checks it
   * against the hashed nonce. The Apple provider has to be switched on in
   * Supabase Auth by the owner (see README); until then this says so.
   */
  const signInWithApple = React.useCallback(async (): Promise<SignInResult> => {
    if (!backendConfigured) return { ok: false, error: "App chưa được cấu hình máy chủ." }
    const rawNonce = Crypto.randomUUID()
    const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce)
    let credential: AppleAuthentication.AppleAuthenticationCredential
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
        nonce: hashedNonce,
      })
    } catch (e) {
      if ((e as { code?: string }).code === "ERR_REQUEST_CANCELED") return { ok: false, error: null }
      return { ok: false, error: "Chưa mở được Đăng nhập với Apple. Thử lại nhé." }
    }
    if (!credential.identityToken) return { ok: false, error: "Apple chưa trả về thông tin đăng nhập. Thử lại nhé." }
    const { data: signedIn, error } = await supabase.auth.signInWithIdToken({ provider: "apple", token: credential.identityToken, nonce: rawNonce })
    if (error || !signedIn.user) {
      const off = /provider.*(not enabled|disabled)|unsupported provider|not.*configured/i.test(error?.message ?? "")
      return {
        ok: false,
        error: off ? "Đăng nhập với Apple chưa được bật trên máy chủ. Bạn dùng Google trong lúc chờ nhé." : "Chưa đăng nhập được với Apple. Thử lại nhé.",
      }
    }
    // Apple gives the name only on the very first sign-in: keep it if the account has none.
    const name = [credential.fullName?.familyName, credential.fullName?.middleName, credential.fullName?.givenName].filter(Boolean).join(" ").trim()
    if (name) {
      const { data: account } = await supabase.from("accounts").select("full_name").eq("id", signedIn.user.id).maybeSingle()
      if (!(account as { full_name?: string } | null)?.full_name) {
        await supabase.from("accounts").update({ full_name: name }).eq("id", signedIn.user.id)
      }
    }
    return { ok: true, needsPhone: await needsPhone(signedIn.user.id) }
  }, [])

  const signOut = React.useCallback(async () => {
    await forgetPushToken()
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
    stale: Boolean(data) && dataFor !== cityKey(city),
    dataError,
    offlineSince,
    loading,
    me,
    myPro,
    mode,
    city,
    setCity,
    refresh,
    refreshMe,
    ensurePro,
    ensureWork,
    signInWithGoogle,
    signInWithApple,
    signOut,
    switchMode,
    patchMe: (fn) => setMe((m) => fn(m)),
    distanceTo,
    blocked,
    block,
    unblock,
    termsAccepted,
    acceptTerms,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/**
 * Resolve a URL slug or database id to a freelancer. Someone outside the
 * loaded city (a link, a chat, a quote) is fetched on demand.
 */
export function useProLookup(id: string | undefined) {
  const { data, ensurePro } = useApp()
  const pro = React.useMemo(() => data?.pros.find((p) => p.id === id || p.uuid === id) ?? null, [data, id])
  const [looked, setLooked] = React.useState<{ id: string; done: boolean } | null>(null)
  React.useEffect(() => {
    if (!id || pro || !data || looked?.id === id) return
    setLooked({ id, done: false })
    void ensurePro(id).finally(() => setLooked({ id, done: true }))
  }, [id, pro, data, looked, ensurePro])
  const searching = !pro && (!data || looked?.id !== id || !looked?.done)
  return { pro, searching }
}

export function usePro(id: string | undefined) {
  return useProLookup(id).pro
}

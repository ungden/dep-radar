/**
 * Row level security, checked the way a client sees it: over the API, with a real
 * JWT, not from inside Postgres. Runs against the local stack.
 *
 *   supabase start && supabase db reset && npm run test:db
 *
 * Skipped when SUPABASE_TEST_URL is not set, so `npm test` stays offline.
 */
import { createHmac } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { beforeAll, describe, expect, it } from "vitest"
import { addDays, todayISO } from "@/lib/utils"

const URL = process.env.SUPABASE_TEST_URL
const ANON = process.env.SUPABASE_TEST_ANON_KEY
const JWT_SECRET = process.env.SUPABASE_TEST_JWT_SECRET
const SERVICE = process.env.SUPABASE_TEST_SERVICE_KEY
const configured = Boolean(URL && ANON && JWT_SECRET && SERVICE)

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url")

/** The local stack signs its tokens with a known secret, so a test can mint one. */
function tokenFor(sub: string) {
  const header = b64({ alg: "HS256", typ: "JWT" })
  const payload = b64({
    sub,
    role: "authenticated",
    aud: "authenticated",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  })
  const signature = createHmac("sha256", JWT_SECRET!).update(`${header}.${payload}`).digest("base64url")
  return `${header}.${payload}.${signature}`
}

const client = (token?: string) =>
  createClient(URL!, ANON!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  })

describe.skipIf(!configured)("row level security over the API", () => {
  let customerId = ""
  let otherCustomerId = ""
  let proId = ""

  beforeAll(async () => {
    const admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } })
    const { data: pro } = await admin.from("pros").select("id").eq("slug", "linh-pham").single()
    proId = pro!.id
    const { data: people } = await admin
      .from("accounts")
      .select("id, full_name")
      .in("full_name", ["Ngọc Hân", "Thảo Vy"])
    customerId = people!.find((p) => p.full_name === "Ngọc Hân")!.id
    otherCustomerId = people!.find((p) => p.full_name === "Thảo Vy")!.id
  })

  it("lets anyone browse published freelancers, works and reviews", async () => {
    const anon = client()
    const [pros, works, reviews] = await Promise.all([
      anon.from("pros").select("slug").eq("published", true),
      anon.from("works").select("id"),
      anon.from("reviews").select("booking_id"),
    ])
    expect(pros.data?.length).toBeGreaterThan(0)
    expect(works.data?.length).toBeGreaterThan(0)
    expect(reviews.data?.length).toBeGreaterThan(0)
  })

  it("shows a visitor the whole review, not just the star count", async () => {
    // Twice now a public thing has been read through a private table and quietly
    // come back empty: the freelancer's name through `accounts`, and the service
    // on a review through `bookings`. A rating with no reviews under it is worse
    // than no rating, so assert the text is actually there.
    const { data, error } = await client()
      .from("reviews")
      .select("booking_id, author_name, service_label, rating, body")
      .limit(5)
    expect(error, error?.message).toBeNull()
    expect(data?.length, "no reviews are visible to an anonymous visitor").toBeGreaterThan(0)
    for (const review of data ?? []) {
      expect(review.body?.length, "review body").toBeGreaterThan(0)
      expect(review.author_name?.length, "review author").toBeGreaterThan(0)
      expect(review.service_label?.length, "which service the review is about").toBeGreaterThan(0)
    }
  })

  it("shows a visitor a freelancer's name and photo", async () => {
    const { data } = await client().from("pros").select("slug, display_name, avatar_path").eq("published", true)
    expect(data?.length).toBeGreaterThan(0)
    for (const pro of data ?? []) {
      expect(pro.display_name?.length, `${pro.slug} has no public name`).toBeGreaterThan(0)
    }
  })

  it("never hands a phone number or an address to an anonymous visitor", async () => {
    const anon = client()
    const accounts = await anon.from("accounts").select("phone")
    expect(accounts.data ?? []).toHaveLength(0)
    const addresses = await anon.from("addresses").select("detail")
    expect(addresses.data ?? []).toHaveLength(0)
  })

  it("hides bookings, wallets and notifications from anonymous visitors", async () => {
    const anon = client()
    for (const table of ["bookings", "wallet_entries", "notifications", "identity_checks"] as const) {
      const { data } = await anon.from(table).select("*")
      expect(data ?? [], table).toHaveLength(0)
    }
  })

  it("shows a customer their own addresses and nobody else's", async () => {
    const mine = await client(tokenFor(customerId)).from("addresses").select("id, account_id")
    expect(mine.data?.length).toBeGreaterThan(0)
    expect(mine.data!.every((a) => a.account_id === customerId)).toBe(true)

    const theirs = await client(tokenFor(otherCustomerId)).from("addresses").select("id, account_id")
    expect(theirs.data!.every((a) => a.account_id === otherCustomerId)).toBe(true)
  })

  it("shows a customer only the bookings they are a party to", async () => {
    const { data } = await client(tokenFor(customerId))
      .from("bookings")
      .select("id, customer_id, pro_id")
    expect(data!.every((b) => b.customer_id === customerId || b.pro_id === customerId)).toBe(true)
  })

  it("refuses a booking status written directly instead of through the RPC", async () => {
    const as = client(tokenFor(proId))
    const { data: job } = await as.from("bookings").select("id").eq("pro_id", proId).limit(1).single()
    const { data: updated } = await as
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", job!.id)
      .select("id")
    expect(updated ?? []).toHaveLength(0)
  })

  it("will not make a signed-in customer an admin, whatever else the update says", async () => {
    // The account-deletion tombstone used to switch the guard off. Send it
    // alongside is_admin, exactly as the exploit did.
    const as = client(tokenFor(customerId))
    const { error } = await as
      .from("accounts")
      .update({ full_name: "Người dùng đã xoá", phone: "", avatar_path: null, is_admin: true })
      .eq("id", customerId)
    expect(error?.message).toMatch(/permission denied/)

    const admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } })
    const { data } = await admin.from("accounts").select("is_admin, phone, full_name").eq("id", customerId).single()
    expect(data!.is_admin).toBe(false)
    expect(data!.phone).not.toBe("")
    expect(data!.full_name).toBe("Ngọc Hân")
  })

  it("will not let a freelancer hand themselves a badge, a rating or a way out of a suspension", async () => {
    const as = client(tokenFor(proId))
    for (const change of [
      { identity_status: "verified" },
      { rating_count: 999 },
      { suspended_at: null },
      { display_name: "Chuyên viên đã rời nền tảng", published: false, avatar_path: null, identity_status: "verified" },
    ]) {
      const { error } = await as.from("pros").update(change as never).eq("id", proId)
      expect(error?.message, JSON.stringify(change)).toMatch(/permission denied/)
    }
    // What a freelancer does own still saves.
    const { error } = await as.from("pros").update({ accepting_jobs: true }).eq("id", proId)
    expect(error).toBeNull()
  })

  it("will not let an account swap its phone number for someone else's", async () => {
    // set_my_phone() is the only way to write a phone number, and only once.
    const { error } = await client(tokenFor(customerId)).rpc("set_my_phone" as never, {
      p_phone: "0900000777",
    } as never)
    expect(error?.message).toMatch(/đã có số điện thoại/)
  })

  it("refuses a listing price outside the catalogue band", async () => {
    const { error } = await client(tokenFor(proId))
      .from("pro_service_prices")
      .upsert({ pro_id: proId, template_id: "nail-design", variant_id: "simple", price: 5000 })
    expect(error?.message).toMatch(/khung cho phép/)
  })

  it("keeps the maintenance functions away from the anon key", async () => {
    const anon = client()
    // enforce_wallet_threshold() could stop every freelancer from taking jobs.
    for (const fn of [
      "enforce_wallet_threshold",
      "expire_stale_bookings",
      "send_booking_reminders",
      "recompute_pro_metrics",
      "is_privileged",
    ] as const) {
      const { error } = await anon.rpc(fn as never, {} as never)
      expect(error, fn).toBeTruthy()
    }
  })

  it("keeps the state machine away from the anon key", async () => {
    const { error } = await client().rpc("confirm_booking", { p_booking: crypto.randomUUID() })
    expect(error).toBeTruthy()
  })

  it("lets anyone read a price and check availability before signing in", async () => {
    const anon = client()
    const fee = await anon.rpc("travel_fee", { distance_km: 10.6 })
    expect(fee.data).toBe(30000)
    const slots = await anon.rpc("free_slots", {
      p_pro: proId,
      p_template: "nail-design",
      p_variant: "simple",
      p_quantity: 1,
      p_date: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
      p_at_home: true,
      p_lat: 21.0181,
      p_lng: 105.829,
    })
    expect(slots.error).toBeNull()
  })

  it("explains a slot it will not book, instead of failing silently", async () => {
    const as = client(tokenFor(customerId))
    const { data } = await as.rpc("availability_problem", {
      p_pro: proId,
      p_template: "nail-design",
      p_variant: "simple",
      p_quantity: 1,
      p_starts_at: new Date(Date.now() + 10 * 60_000).toISOString(),
      p_at_home: true,
      p_lat: 21.0181,
      p_lng: 105.829,
    })
    expect(data).toMatch(/Cần đặt trước/)
  })

  it("books, then refuses the same slot twice", async () => {
    const as = client(tokenFor(customerId))
    const { data: addresses } = await as.from("addresses").select("id").limit(1)

    // Ask the database which day has openings rather than guessing one: the demo
    // freelancers take Sundays off, and a guessed date makes the test lie.
    const ask = (date: string) =>
      as.rpc("free_slots", {
        p_pro: proId,
        p_template: "nail-design",
        p_variant: "simple",
        p_quantity: 1,
        p_date: date,
        p_at_home: true,
        p_lat: 21.0181,
        p_lng: 105.829,
      })

    let startsAt: string | undefined
    for (let i = 1; i <= 10 && !startsAt; i++) {
      const date = addDays(todayISO(), i)
      const { data } = await ask(date)
      startsAt = (data as unknown as string[])?.at(-1)
    }
    expect(startsAt, "the demo freelancer has no free slot in the next ten days").toBeTruthy()

    const args = {
      p_pro: proId,
      p_template: "nail-design",
      p_variant: "simple",
      p_starts_at: startsAt!,
      p_at_home: true,
      p_address_id: addresses![0].id,
      p_quantity: 1,
      p_note: "test",
      p_payment: "cash" as const,
    }
    const first = await as.rpc("create_booking", args)
    expect(first.error, first.error?.message).toBeNull()

    const again = await as.rpc("create_booking", args)
    expect(again.error?.message).toMatch(/đã có lịch|vừa có người đặt/)
  })

  // The three trades --------------------------------------------------------

  it("shows open casting calls to everyone, and each application only to its two parties", async () => {
    const admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } })
    const { data: poster } = await admin.from("pros").select("id, city, district").eq("slug", "thu-anh").single()
    const as = client(tokenFor(poster!.id))
    const created = await as.rpc("create_casting", {
      p_category: "makeup",
      p_title: "Cần mẫu makeup kỷ yếu (test RLS)",
      p_description: "Miễn phí, cho phép chụp và đăng ảnh.",
      p_starts_at: new Date(Date.now() + 3 * 86400_000).toISOString(),
      p_city: poster!.city,
      p_district: poster!.district,
      p_slots: 1,
      p_compensation: "free",
    })
    expect(created.error, created.error?.message).toBeNull()
    const castingId = created.data as string

    try {
      const applied = await client(tokenFor(customerId)).rpc("apply_casting", {
        p_casting: castingId,
        p_message: "Em muốn làm mẫu",
      })
      expect(applied.error, applied.error?.message).toBeNull()

      const seen = await client().from("castings").select("id, accepted_count").eq("id", castingId)
      expect(seen.data, "an anonymous visitor cannot see an open call").toHaveLength(1)

      const byAnon = await client().from("casting_applications").select("id").eq("casting_id", castingId)
      expect(byAnon.data ?? []).toHaveLength(0)
      const byStranger = await client(tokenFor(otherCustomerId))
        .from("casting_applications")
        .select("id")
        .eq("casting_id", castingId)
      expect(byStranger.data ?? []).toHaveLength(0)
      const byApplicant = await client(tokenFor(customerId))
        .from("casting_applications")
        .select("id, account_id")
        .eq("casting_id", castingId)
      expect(byApplicant.data?.map((a) => a.account_id)).toEqual([customerId])
      const byPoster = await as.from("casting_applications").select("id").eq("casting_id", castingId)
      expect(byPoster.data).toHaveLength(1)

      // Every change goes through a function: a direct write is refused.
      const direct = await client(tokenFor(customerId))
        .from("casting_applications")
        .update({ status: "accepted" })
        .eq("casting_id", castingId)
      expect(direct.error?.message).toMatch(/permission denied/)
      const forged = await as.from("castings").update({ accepted_count: 0, slots: 10 }).eq("id", castingId)
      expect(forged.error?.message).toMatch(/permission denied/)
    } finally {
      // Deleted rather than closed: a closed call still counts towards the poster's
      // five a week (20260924100500), and this suite runs more than once locally.
      await admin.from("castings").delete().eq("id", castingId)
    }
  })

  it("keeps a freelancer's review of a customer away from the public", async () => {
    const admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } })
    const { data: booking } = await admin
      .from("bookings")
      .select("id, pro_id, customer_id")
      .eq("status", "completed")
      .eq("customer_id", customerId)
      // The newest: an older seeded one is past the 14-day window, and which one
      // came back first used to depend on row order.
      .order("completed_at", { ascending: false })
      .limit(1)
      .single()
    const written = await client(tokenFor(booking!.pro_id)).rpc("review_customer", {
      p_booking: booking!.id,
      p_rating: 5,
      p_body: "Khách đúng giờ.",
    })
    // Once per booking: a second run of this suite finds it already written.
    if (written.error) expect(written.error.message).toMatch(/đã đánh giá/)

    const byAnon = await client().from("customer_reviews").select("booking_id")
    expect(byAnon.data ?? []).toHaveLength(0)
    const bySubject = await client(tokenFor(customerId)).from("customer_reviews").select("customer_id")
    expect(bySubject.data?.length).toBeGreaterThan(0)
    expect(bySubject.data!.every((r) => r.customer_id === customerId)).toBe(true)
    const byStranger = await client(tokenFor(otherCustomerId))
      .from("customer_reviews")
      .select("booking_id")
      .eq("customer_id", customerId)
    expect(byStranger.data ?? [], "another customer read reviews about someone").toHaveLength(0)
    // A freelancer who has a booking with the customer reads their history...
    const byTheirPro = await client(tokenFor(proId))
      .from("customer_reviews")
      .select("booking_id")
      .eq("customer_id", customerId)
    expect(byTheirPro.data?.length, "a freelancer with a booking cannot check the customer").toBeGreaterThan(0)
    // ...and a freelancer who never met them does not (20260924100000).
    const { data: booked } = await admin.from("bookings").select("pro_id").eq("customer_id", customerId)
    const met = new Set((booked ?? []).map((b) => b.pro_id))
    const { data: pros } = await admin.from("pros").select("id").eq("published", true)
    const stranger = (pros ?? []).find((p) => !met.has(p.id))
    expect(stranger, "the demo data has no freelancer the customer never booked").toBeTruthy()
    const byStrangerPro = await client(tokenFor(stranger!.id))
      .from("customer_reviews")
      .select("booking_id")
      .eq("customer_id", customerId)
    expect(byStrangerPro.data ?? [], "any freelancer could look a customer up").toHaveLength(0)
  })

  it("counts feed interest without letting anyone write the numbers", async () => {
    const anon = client()
    const { data: work } = await anon.from("works").select("id, slug").limit(1).single()
    const logged = await anon.rpc("log_work_events", {
      p_events: [
        { work: work!.id, kind: "impression" },
        { work: work!.slug, kind: "open" },
      ],
    })
    expect(logged.error, logged.error?.message).toBeNull()
    const totals = await anon.rpc("work_stats_30d")
    expect(totals.error, totals.error?.message).toBeNull()
    expect((totals.data as { work_id: string }[]).some((r) => r.work_id === work!.id)).toBe(true)

    const raw = await anon.from("work_stats_daily").select("*")
    expect(raw.data ?? []).toHaveLength(0)
    const forged = await client(tokenFor(customerId))
      .from("work_stats_daily")
      .insert({ work_id: work!.id, day: todayISO(), impressions: 100000 })
    expect(forged.error?.message).toMatch(/permission denied/)
  })

  it("lets a model edit their own casting card and nobody else's", async () => {
    const admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } })
    const { data: model } = await admin.from("pros").select("id").eq("slug", "thu-anh").single()
    const own = await client(tokenFor(model!.id))
      .from("model_profiles")
      .upsert({ pro_id: model!.id, height_cm: 165, top_size: "S", styles: ["Thanh lịch"] })
    expect(own.error, own.error?.message).toBeNull()

    const seen = await client().from("model_profiles").select("height_cm").eq("pro_id", model!.id)
    expect(seen.data?.[0]?.height_cm).toBe(165)

    const { data: changed } = await client(tokenFor(proId))
      .from("model_profiles")
      .update({ height_cm: 200 })
      .eq("pro_id", model!.id)
      .select("pro_id")
    expect(changed ?? []).toHaveLength(0)
  })

  // The 2026-09-24 fixes ----------------------------------------------------

  it("hides a suspended freelancer and their posts from the public", async () => {
    const admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } })
    const { data: target } = await admin.from("pros").select("id").eq("slug", "thu-anh").single()
    await admin.from("pros").update({ suspended_at: new Date().toISOString() }).eq("id", target!.id)
    try {
      const pros = await client().from("pros").select("id").eq("id", target!.id)
      expect(pros.data ?? []).toHaveLength(0)
      const works = await client().from("works").select("id").eq("pro_id", target!.id)
      expect(works.data ?? []).toHaveLength(0)
      const own = await client(tokenFor(target!.id)).from("works").select("id").eq("pro_id", target!.id)
      expect(own.data?.length, "a suspended freelancer lost sight of their own posts").toBeGreaterThan(0)
    } finally {
      await admin.from("pros").update({ suspended_at: null }).eq("id", target!.id)
    }
  })

  it("lets anyone read the platform settings, and only an admin change them", async () => {
    const read = await client().from("platform_settings").select("*")
    expect(read.error, read.error?.message).toBeNull()
    expect(read.data).toHaveLength(1)
    const { data: changed } = await client(tokenFor(customerId))
      .from("platform_settings")
      .update({ topup_account_no: "0123456789" })
      .eq("id", true)
      .select("id")
    expect(changed ?? []).toHaveLength(0)
  })

  it("keeps busy time, blocks and push tokens to their owner", async () => {
    const pro = client(tokenFor(proId))
    const startsAt = new Date(Date.now() + 3 * 86400_000)
    const added = await pro.rpc("add_time_block" as never, {
      p_starts_at: startsAt.toISOString(),
      p_ends_at: new Date(startsAt.getTime() + 3600_000).toISOString(),
      p_note: "Test RLS",
    } as never)
    expect(added.error, added.error?.message).toBeNull()
    const blockId = added.data as unknown as string
    try {
      const mine = await pro.from("time_blocks" as never).select("id").eq("id", blockId)
      expect(mine.data).toHaveLength(1)
      const theirs = await client(tokenFor(customerId)).from("time_blocks" as never).select("id").eq("id", blockId)
      expect(theirs.data ?? []).toHaveLength(0)
      const direct = await client(tokenFor(proId))
        .from("time_blocks" as never)
        .insert({ pro_id: proId, starts_at: startsAt.toISOString(), ends_at: startsAt.toISOString() } as never)
      expect(direct.error?.message).toMatch(/permission denied/)
    } finally {
      await pro.rpc("remove_time_block" as never, { p_id: blockId } as never)
    }

    const blocked = await client(tokenFor(customerId)).rpc("block_user" as never, { p_account: otherCustomerId } as never)
    expect(blocked.error, blocked.error?.message).toBeNull()
    try {
      const byBlocker = await client(tokenFor(customerId)).from("user_blocks" as never).select("blocked")
      expect(byBlocker.data).toHaveLength(1)
      const byBlocked = await client(tokenFor(otherCustomerId)).from("user_blocks" as never).select("blocker")
      expect(byBlocked.data ?? []).toHaveLength(0)
    } finally {
      await client(tokenFor(customerId)).rpc("unblock_user" as never, { p_account: otherCustomerId } as never)
    }

    const token = "ExponentPushToken[rls-test-00000000001]"
    const registered = await client(tokenFor(customerId)).rpc("register_push_token" as never, {
      p_token: token,
      p_platform: "ios",
    } as never)
    expect(registered.error, registered.error?.message).toBeNull()
    const byStranger = await client(tokenFor(otherCustomerId)).from("push_tokens" as never).select("token")
    expect(byStranger.data ?? []).toHaveLength(0)
    const admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } })
    await admin.from("push_tokens" as never).delete().eq("token", token)
  })

  it("lists free days to anyone, like free slots", async () => {
    const { data, error } = await client().rpc("free_days" as never, {
      p_pro: proId,
      p_template: "nail-design",
      p_variant: "simple",
      p_quantity: 1,
      p_from: todayISO(),
      p_days: 14,
      p_at_home: true,
      p_lat: 21.0181,
      p_lng: 105.829,
    } as never)
    expect(error, error?.message).toBeNull()
    expect((data as unknown as string[]).length).toBeGreaterThan(0)
  })

  it("keeps the new actions away from the anon key", async () => {
    const anon = client()
    for (const [fn, args] of [
      ["create_casting", {}],
      ["apply_casting", { p_casting: crypto.randomUUID() }],
      ["set_interests", { p_categories: ["nail"] }],
      ["deliver_booking", { p_booking: crypto.randomUUID(), p_url: "https://example.com" }],
      ["link_bookings", { p_bookings: [crypto.randomUUID(), crypto.randomUUID()] }],
      ["review_customer", { p_booking: crypto.randomUUID(), p_rating: 1 }],
      ["remind_overdue_deliveries", {}],
      ["add_time_block", { p_starts_at: new Date().toISOString(), p_ends_at: new Date().toISOString() }],
      ["block_user", { p_account: crypto.randomUUID() }],
      ["register_push_token", { p_token: "ExponentPushToken[anon-test-000000000]", p_platform: "ios" }],
      ["dispute_no_show", { p_booking: crypto.randomUUID(), p_reason: "Không đúng sự thật" }],
      ["release_no_show_credits", {}],
    ] as const) {
      const { error } = await anon.rpc(fn as never, args as never)
      expect(error, fn).toBeTruthy()
    }
  })
})

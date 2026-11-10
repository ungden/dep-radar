import * as React from "react"
import { FlashList } from "@shopify/flash-list"
import { router } from "expo-router"
import { Alert, View } from "react-native"
import { confirmBookingDone, isUpcoming, listBookings, type BookingItem } from "@/data/bookings"
import { formatDateLong, formatPrice, localDate, localTime } from "@/data/format"
import { listMyRequests, type MyRequest } from "@/data/requests"
import { customerJobActions, getTemplate, getVariant, rebookCart, reviewWindow } from "@/shared"
import { BookingRow, type ToDo } from "@/components/booking-row"
import { PageBand } from "@/components/page-band"
import { SignInGate } from "@/components/sign-in-gate"
import { TextTabs } from "@/components/switches"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter, radius } from "@/theme"
import { EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
import { haptic } from "@/ui/haptics"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"
import { useToast } from "@/ui/toast"

type Item =
  | { kind: "booking"; id: string; booking: BookingItem; todo: ToDo | null }
  | { kind: "request"; id: string; request: MyRequest }
  | { kind: "heading"; id: string; text: string }

/** A declined or lapsed booking is worth a nudge for two days, then it is just history. */
const RECENT = 2 * 24 * 3_600_000

/**
 * The customer's appointments. What needs them comes first ("Cần bạn"),
 * then what is coming, including requests still looking for an Artist, so a
 * request sent a minute ago is never "Chưa có lịch sắp tới".
 */
export default function MyBookings() {
  const { uid } = useApp()
  const [tab, setTab] = React.useState<"upcoming" | "past">("upcoming")
  const bookings = useAsync(uid ? () => listBookings(uid, "customer") : null, [uid])
  const requests = useAsync(uid ? () => listMyRequests(uid) : null, [uid])
  const [busy, setBusy] = React.useState<string | null>(null)
  const toast = useToast(112)

  if (!uid) return <SignInGate title="Lịch hẹn" text="Đăng nhập để xem lịch hẹn, nhắn tin, đổi giờ hoặc huỷ." />

  const now = Date.now()
  const all = bookings.value ?? []

  const confirmDone = (b: BookingItem) =>
    Alert.alert("Xác nhận đã xong?", `Lịch hẹn với ${b.pro.name} chuyển sang hoàn thành, và bạn đánh giá được trong 14 ngày.`, [
      { text: "Chưa", style: "cancel" },
      {
        text: "Đã xong",
        onPress: async () => {
          setBusy(b.id)
          const res = await confirmBookingDone(b.id)
          setBusy(null)
          if (!res.ok) {
            haptic.error()
            return Alert.alert("Chưa xác nhận được", res.error)
          }
          haptic.success()
          toast.show("Đã xác nhận hoàn thành")
          void bookings.reload()
        },
      },
    ])

  // What the customer has to do on a booking, if anything.
  const todoOf = (b: BookingItem): ToDo | null => {
    const job = customerJobActions({ status: b.status, startsAt: new Date(b.startsAt), endsAt: new Date(b.endsAt) }, new Date(now))
    const open = { label: "Xem lịch hẹn", onPress: () => router.push({ pathname: "/bookings/[id]", params: { id: b.id } }) }
    if (b.rescheduleTo && b.rescheduleBy === "pro" && b.status === "confirmed")
      return { text: `${b.pro.name} đề nghị đổi sang ${localTime(b.rescheduleTo)} ${formatDateLong(localDate(b.rescheduleTo))}`, button: { ...open, label: "Trả lời" } }
    if (job.confirmDone) return { text: "xác nhận đã làm xong", button: { label: "Xác nhận đã xong", busy: busy === b.id, onPress: () => confirmDone(b) } }
    if (b.delivery?.deliveredAt && !b.delivery.acceptedAt) return { text: "xem file và xác nhận đã nhận", button: { ...open, label: "Xem file" } }
    if (b.status === "completed" && !b.reviewed && reviewWindow(b.completedAt, new Date(now)).open)
      return { text: "đánh giá buổi làm", button: { label: "Viết đánh giá", onPress: () => router.push({ pathname: "/danh-gia/[bookingId]", params: { bookingId: b.id } }) } }
    const lapsed = b.status === "declined" || b.status === "expired" || (b.status === "cancelled" && b.cancelledBy === "pro")
    if (lapsed && b.pro.slug && now - Date.parse(b.cancelledAt ?? b.confirmBy) < RECENT)
      return {
        text: b.status === "expired" ? `${b.pro.name} chưa kịp nhận, chọn giờ khác` : `${b.pro.name} không nhận được, chọn giờ khác`,
        button: { label: "Đặt giờ khác", onPress: () => router.push({ pathname: "/book/[proId]", params: { proId: b.pro.slug, cart: rebookCart(b) } }) },
      }
    return null
  }

  const withTodo = all.map((b) => ({ b, todo: todoOf(b) }))
  // Most pressing first: a job happening now, an answer the Artist waits for, then the rest.
  const rank = (b: BookingItem) => (b.status === "confirmed" || b.status === "in_progress" ? 0 : b.status === "completed" && b.delivery && !b.delivery.acceptedAt ? 1 : b.status === "completed" ? 3 : 2)
  const needs = withTodo.filter((x) => x.todo).sort((a, b) => rank(a.b) - rank(b.b) || b.b.startsAt.localeCompare(a.b.startsAt))
  const needIds = new Set(needs.map((x) => x.b.id))
  const looking = (requests.value ?? []).filter((r) => r.status === "open")

  const items: Item[] = []
  if (needs.length) {
    items.push({ kind: "heading", id: "h-need", text: "Cần bạn" })
    for (const { b, todo } of needs) items.push({ kind: "booking", id: b.id, booking: b, todo })
  }
  if (tab === "upcoming") {
    const coming: ({ at: string } & ({ kind: "booking"; booking: BookingItem } | { kind: "request"; request: MyRequest }))[] = [
      ...all.filter((b) => isUpcoming(b) && !needIds.has(b.id)).map((booking) => ({ at: booking.startsAt, kind: "booking" as const, booking })),
      ...looking.map((request) => ({ at: request.startsAt, kind: "request" as const, request })),
    ].sort((a, b) => a.at.localeCompare(b.at))
    if (coming.length && needs.length) items.push({ kind: "heading", id: "h-coming", text: "Sắp tới" })
    for (const c of coming)
      items.push(c.kind === "booking" ? { kind: "booking", id: c.booking.id, booking: c.booking, todo: null } : { kind: "request", id: `r-${c.request.id}`, request: c.request })
  } else {
    let lastMonth = ""
    for (const b of all.filter((x) => !isUpcoming(x) && !needIds.has(x.id))) {
      const month = b.date.slice(0, 7)
      if (month !== lastMonth) {
        lastMonth = month
        items.push({ kind: "heading", id: `m-${month}`, text: `Tháng ${Number(month.slice(5))}/${month.slice(0, 4)}` })
      }
      items.push({ kind: "booking", id: b.id, booking: b, todo: null })
    }
  }
  const completed = all.filter((b) => b.status === "completed")
  const loading = (bookings.loading && !bookings.value) || (requests.loading && !requests.value)
  const onlyNeeds = items.every((i) => i.kind !== "request" && (i.kind === "heading" || needIds.has(i.id)))

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageBand title="Lịch hẹn">
        <TextTabs
          items={[
            { value: "upcoming", label: "Sắp tới" },
            { value: "past", label: "Đã qua" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </PageBand>
      <FlashList
        contentInsetAdjustmentBehavior="automatic"
        data={loading ? [] : items}
        keyExtractor={(i) => i.id}
        getItemType={(i) => i.kind}
        extraData={busy}
        contentContainerStyle={{ padding: gutter }}
        renderItem={({ item }) =>
          item.kind === "heading" ? (
            <Txt v="lead" w={700} style={{ paddingTop: 8, paddingBottom: 10 }}>
              {item.text}
            </Txt>
          ) : item.kind === "request" ? (
            <View style={{ paddingBottom: 10 }}>
              <RequestCard request={item.request} />
            </View>
          ) : (
            <View style={{ paddingBottom: 10 }}>
              <BookingRow booking={item.booking} as="customer" todo={item.todo} />
              {tab === "past" && item.booking.status === "completed" && item.booking.pro.slug ? (
                <Press onPress={() => router.push({ pathname: "/book/[proId]", params: { proId: item.booking.pro.slug, cart: rebookCart(item.booking) } })} style={{ minHeight: 44, alignSelf: "flex-end", justifyContent: "center", paddingHorizontal: 12 }}>
                  <Txt color={colors.accentDark} w={600}>
                    Đặt lại
                  </Txt>
                </Press>
              ) : null}
            </View>
          )
        }
        refreshControl={refreshControl(bookings.refreshing || requests.refreshing, () => {
          void bookings.refresh()
          void requests.refresh()
        })}
        ListHeaderComponent={
          <View style={{ gap: 10, paddingBottom: 10 }}>
            {tab === "past" && completed.length ? (
              <Txt v="meta" color={colors.inkSoft}>
                {completed.length} lịch hoàn thành · {formatPrice(completed.reduce((n, b) => n + b.quote.total - b.discount, 0))}
              </Txt>
            ) : null}
            {bookings.error ? <ErrorNote text={bookings.error} onRetry={() => void bookings.reload()} /> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} style={{ height: 96, borderRadius: 12 }} />
              ))}
            </View>
          ) : bookings.error ? null : tab === "upcoming" ? (
            <EmptyState title="Chưa có lịch sắp tới" text="Chọn Artist và đặt lịch, hoặc đặt theo nhu cầu để Artist phù hợp nhận." action="Khám phá" onAction={() => router.navigate("/")} />
          ) : (
            <EmptyState title="Chưa có lịch nào đã qua" />
          )
        }
        ListFooterComponent={
          <View style={{ gap: 8, paddingTop: 8 }}>
            {tab === "upcoming" && onlyNeeds && items.length ? (
              <Txt color={colors.inkSoft}>Không còn lịch nào sắp tới.</Txt>
            ) : null}
            {(requests.value ?? []).length ? (
              <Press onPress={() => router.push("/yeu-cau")} accessibilityRole="link" style={{ minHeight: 44, justifyContent: "center", alignSelf: "center" }}>
                <Txt v="meta" w={600} color={colors.accentDark}>
                  Xem các đơn theo nhu cầu đã gửi
                </Txt>
              </Press>
            ) : null}
          </View>
        }
      />
      {toast.element}
    </View>
  )
}

/** A request still looking for an Artist, in the same list as bookings. */
function RequestCard({ request: r }: { request: MyRequest }) {
  const t = getTemplate(r.templateId)
  const v = getVariant(r.templateId, r.variantId)
  return (
    <Press
      onPress={() => router.push({ pathname: "/yeu-cau/[id]", params: { id: r.id } })}
      accessibilityLabel={`${t?.name ?? "Đơn"}, đang tìm Artist`}
      style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, gap: 6 }}
    >
      <View style={{ alignSelf: "flex-start", backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 }}>
        <Txt v="meta" w={700} color={colors.accentDark}>
          Đang tìm Artist
        </Txt>
      </View>
      <Txt w={700}>
        {r.contract?.serviceName ?? t?.name ?? r.templateId}
        {v ? ` · ${r.contract?.variantLabel ?? v.label}` : ""}
      </Txt>
      <Txt v="meta" color={colors.inkSoft}>
        {r.time}, {formatDateLong(r.date)} · {r.atHome ? "Tại nhà" : "Tại cơ sở"}
      </Txt>
      <Txt v="meta" color={colors.muted}>
        Artist phù hợp nhận trước sẽ làm. Chưa ai nhận thì bạn không mất gì.
      </Txt>
    </Press>
  )
}

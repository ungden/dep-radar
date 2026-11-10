import { requestCopy } from "@/shared"
import { Pill } from "@/components/tiles"
import * as React from "react"
import { FlashList } from "@shopify/flash-list"
import { router, useIsFocused } from "expo-router"
import { Alert, View } from "react-native"
import { getTemplate, getVariant, travelDistanceKm } from "@/shared"
import { formatDateLong, formatKm, formatPrice } from "@/data/format"
import { listBookings, type BookingItem } from "@/data/bookings"
import { PendingBookingCard } from "@/components/partner-cards"
import { isSpa } from "@/shared"
import { useNow } from "@/state/keyboard"
import { useToast } from "@/ui/toast"
import { jobGone, listJobs, takeJob, type JobItem } from "@/data/jobs"
import { ReferencePhotos } from "@/components/reference-photos"
import { FeeCard, OWING_NOTE, useFee } from "@/components/fee-card"
import { StudioHeader } from "@/components/studio-header"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter, hairline, radius } from "@/theme"
import { Button } from "@/ui/button"
import { EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { haptic } from "@/ui/haptics"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"

type Scope = "match" | "all"

/**
 * Customers' requests. Every freelancer who can do one is told ('job_new');
 * the price is fixed, and the first to press "Nhận việc" gets a confirmed
 * booking (take_job). Same board as /studio/jobs on the web.
 */
export default function NewJobs() {
  const app = useApp()
  const pro = app.myPro
  const uid = app.uid
  const jobs = useAsync(uid ? () => listJobs(uid) : null, [uid])
  // Bookings sent to this partner by name come first: they wait for this partner only.
  const direct = useAsync(uid ? () => listBookings(uid, "pro") : null, [uid])
  const toast = useToast(112)
  const focused = useIsFocused()
  const reloadJobs = React.useRef(jobs.reload)
  reloadJobs.current = jobs.reload
  // Another freelancer can take a request at any moment: re-read the board
  // every 20 seconds while this tab is on screen (it already reloads on focus).
  React.useEffect(() => {
    if (!focused || !uid) return
    const t = setInterval(() => void reloadJobs.current(), 20_000)
    return () => clearInterval(t)
  }, [focused, uid])
  const fee = useFee(uid)
  const [scope, setScope] = React.useState<Scope>("match")
  const [busy, setBusy] = React.useState<string | null>(null)
  const waiting = (direct.value ?? []).filter((b) => b.status === "pending").sort((a, b) => a.confirmBy.localeCompare(b.confirmBy))
  const now = useNow(waiting.length > 0)

  if (!pro || !uid) return null
  const accepted = (b: BookingItem) => {
    direct.setValue((list) => list?.map((x) => (x.id === b.id ? { ...x, status: "confirmed" } : x)))
    toast.show(`Đã nhận lịch của ${b.customer.name}`)
  }
  const kmTo = (j: JobItem) => travelDistanceKm(pro.city, pro.district, j.city, j.district)
  const problem = (j: JobItem): string | null => fee.owing ? OWING_NOTE : j.eligibility?.reason ?? (j.eligibility ? null : "Chưa kiểm tra được điều kiện nhận việc.")
  const list = (jobs.value ?? []).filter((j) => !j.mine).filter((j) => scope === "all" || problem(j) === null)

  const take = async (j: JobItem) => {
    setBusy(j.id)
    const res = await takeJob(j.id).catch(() => ({ ok: false as const, error: "Chưa kết nối được máy chủ. Tải lại bảng đơn rồi thử lại." }))
    setBusy(null)
    if (res.ok) {
      haptic.success()
      jobs.setValue((all) => all?.filter((x) => x.id !== j.id))
      return router.push({ pathname: "/bookings/[id]", params: { id: res.data } })
    }
    haptic.error()
    if (jobGone(res.error)) jobs.setValue((all) => all?.filter((x) => x.id !== j.id))
    else void fee.reload()
    Alert.alert("Chưa nhận được đơn", res.error)
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StudioHeader title="Đơn" subtitle="Khách đặt bạn, và đơn khách đang cần quanh bạn">
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: gutter, paddingTop: 4, paddingBottom: 8 }}>
          <Pill label="Bạn nhận được" selected={scope === "match"} onCanvas={false} onPress={() => setScope("match")} />
          <Pill label="Cùng khu vực" selected={scope === "all"} onCanvas={false} onPress={() => setScope("all")} />
        </View>
      </StudioHeader>
      {!pro.published || !pro.acceptingJobs ? (
        <Txt v="meta" color={colors.warning} style={{ paddingHorizontal: gutter, paddingTop: 12 }}>
          {pro.published ? "Bạn đang tạm nghỉ nhận lịch. Bật lại ở Hôm nay để nhận đơn." : "Đơn mới hiện ở đây sau khi hồ sơ của bạn được duyệt."}
        </Txt>
      ) : null}
      <FlashList
        data={list}
        keyExtractor={(j) => j.id}
        extraData={[busy, fee.owing]}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 20, paddingBottom: 32 }}
        refreshControl={refreshControl(jobs.refreshing || direct.refreshing, () => {
          void jobs.refresh()
          void direct.refresh()
          void fee.refresh()
        })}
        renderItem={({ item: j }) => {
          const t = getTemplate(j.templateId)
          const v = getVariant(j.templateId, j.variantId)
          const km = kmTo(j)
          const why = problem(j)
          return (
            <View style={{ marginBottom: 20, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surface, opacity: why ? 0.72 : 1 }}>
              <View style={{ padding: 18, gap: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt v="title">{j.contract?.serviceName ?? t?.name ?? j.templateId}</Txt>
                    {v ? (
                      <Txt v="meta" color={colors.inkSoft}>
                        {j.contract?.variantLabel ?? v.label}
                        {j.quantity > 1 ? ` × ${j.quantity} người` : ""}
                      </Txt>
                    ) : null}
                  </View>
                  <Txt w={600} tabular>
                    {formatPrice(j.price * j.quantity)}
                  </Txt>
                </View>
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Icon name="clock" size={16} color={colors.muted} />
                    <Txt v="meta" color={colors.inkSoft}>
                      {j.time}, {formatDateLong(j.date)}
                    </Txt>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Icon name="pin" size={16} color={colors.muted} />
                    <Txt v="meta" color={colors.inkSoft} style={{ flexShrink: 1 }}>
                      {j.district}
                      {km !== null ? ` · cách bạn ${formatKm(km)}` : ""}
                    </Txt>
                  </View>
                </View>
                {j.description ? <Txt color={colors.inkSoft}>{j.description}</Txt> : null}
                <ReferencePhotos paths={j.referencePhotos} title="Ảnh mẫu khách muốn" />
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 14, borderTopWidth: hairline, borderTopColor: colors.line }}>
                  {why ? (
                    <Txt v="meta" color={fee.owing && why === OWING_NOTE ? colors.warning : colors.muted} style={{ flex: 1 }}>
                      {why}
                    </Txt>
                  ) : (
                    <>
                      <View>
                        <Txt v="meta" color={colors.muted}>
                          Bạn nhận
                        </Txt>
                        <Txt v="title" tabular color={colors.accentDark}>
                          {j.eligibility?.payout != null ? formatPrice(j.eligibility.payout) : "—"}
                        </Txt>
                      </View>
                      <Button label="Nhận đơn" size="sm" busy={busy === j.id} disabled={Boolean(busy)} style={{ borderRadius: radius.full, paddingHorizontal: 20 }} onPress={() => Alert.alert("Nhận đơn này?", "Lịch sẽ được xác nhận ngay nếu đơn vẫn còn.", [
                        { text: "Xem tiếp", style: "cancel" }, { text: "Nhận đơn", onPress: () => void take(j) },
                      ])} />
                    </>
                  )}
                </View>
              </View>
            </View>
          )
        }}
        ListHeaderComponent={
          <View style={{ gap: 12, paddingBottom: 12 }}>
            {fee.owing ? <FeeCard fee={fee.value} /> : null}
            {waiting.length ? (
              <View style={{ gap: 12, paddingBottom: 12 }}>
                <Txt v="title">Khách đặt bạn</Txt>
                {waiting.map((b) => (
                  <PendingBookingCard
                    key={b.id}
                    booking={b}
                    now={now}
                    km={b.atHome ? travelDistanceKm(pro.city, pro.district, b.city, b.district) : null}
                    spa={isSpa(pro)}
                    blocked={fee.owing}
                    onAccepted={accepted}
                    onFailed={() => void fee.reload()}
                  />
                ))}
              </View>
            ) : null}
            <View style={{ gap: 2 }}>
              <Txt v="title">{requestCopy.vi.board}</Txt>
              <Txt v="meta" color={colors.inkSoft}>{requestCopy.vi.boardHint}</Txt>
            </View>
            {jobs.error ? <ErrorNote text={jobs.error} onRetry={() => void jobs.reload()} /> : null}
          </View>
        }
        ListEmptyComponent={
          jobs.loading ? (
            <View style={{ gap: 12 }}>
              {[0, 1].map((i) => (
                <Skeleton key={i} style={{ height: 130, borderRadius: radius.md }} />
              ))}
            </View>
          ) : jobs.error ? null : (
            <EmptyState
              title="Chưa có đơn mới quanh bạn"
              text={scope === "match" ? "Chưa có đơn đúng gói bạn niêm yết và trong phạm vi bạn đi. Có đơn bạn nhận được, 360đẹp báo ngay." : undefined}
              action={scope === "match" ? "Xem đơn cùng khu vực" : undefined}
              onAction={() => setScope("all")}
            />
          )
        }
      />
      {toast.element}
    </View>
  )
}

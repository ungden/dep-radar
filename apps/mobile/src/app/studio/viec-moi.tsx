import * as React from "react"
import { FlashList } from "@shopify/flash-list"
import { router, useIsFocused } from "expo-router"
import { Alert, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { getTemplate, getVariant, travelDistanceKm } from "@/shared"
import { formatDateLong, formatKm, formatPrice } from "@/data/format"
import { jobGone, listJobs, takeJob, type JobItem } from "@/data/jobs"
import { FeeCard, OWING_NOTE, useFee } from "@/components/fee-card"
import { StudioHeader } from "@/components/studio-header"
import { useApp } from "@/state/app"
import { useAsync } from "@/state/use-async"
import { colors, gutter, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Card, Chip, EmptyState, ErrorNote, Skeleton } from "@/ui/bits"
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
  const insets = useSafeAreaInsets()
  const pro = app.myPro
  const uid = app.uid
  const jobs = useAsync(uid ? () => listJobs(uid) : null, [uid])
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

  if (!pro || !uid) return null
  const listed = (j: JobItem) => app.data?.services.find((s) => s.proId === pro.id && s.templateId === j.templateId && s.active)?.prices[j.variantId] ?? null
  const kmTo = (j: JobItem) => travelDistanceKm(pro.city, pro.district, j.city, j.district)
  const inRange = (j: JobItem) => {
    const km = kmTo(j)
    return km === null || km <= pro.maxTravelKm
  }
  // What take_job itself checks that the app can know: the same city, a price listed for this package.
  const problem = (j: JobItem): string | null => {
    if (j.city !== pro.city) return "Yêu cầu ở thành phố khác."
    if (listed(j) === null) return "Bạn chưa niêm yết gói này nên chưa nhận được."
    if (!inRange(j)) return "Ngoài phạm vi bạn đi."
    if (!pro.acceptingJobs) return "Bật nhận lịch ở tab Tôi để nhận việc."
    if (fee.owing) return OWING_NOTE
    return null
  }

  const list = (jobs.value ?? [])
    .filter((j) => !j.mine)
    .filter((j) => scope === "all" || (j.city === pro.city && listed(j) !== null && inRange(j)))

  const take = async (j: JobItem) => {
    setBusy(j.id)
    const res = await takeJob(j.id)
    setBusy(null)
    if (res.ok) {
      haptic.success()
      jobs.setValue((all) => all?.filter((x) => x.id !== j.id))
      return router.push({ pathname: "/bookings/[id]", params: { id: res.data } })
    }
    haptic.error()
    if (jobGone(res.error)) jobs.setValue((all) => all?.filter((x) => x.id !== j.id))
    else void fee.reload()
    Alert.alert("Chưa nhận được việc", res.error)
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <StudioHeader title="Việc mới" />
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: gutter, paddingBottom: 12 }}>
        <Chip label="Bạn nhận được" selected={scope === "match"} onPress={() => setScope("match")} />
        <Chip label="Tất cả" selected={scope === "all"} onPress={() => setScope("all")} />
      </View>
      {!pro.acceptingJobs ? (
        <Txt v="meta" color={colors.warning} style={{ paddingHorizontal: gutter, paddingBottom: 8 }}>
          Bạn đang tạm nghỉ nhận lịch. Bật lại ở tab Tôi để nhận việc.
        </Txt>
      ) : null}
      <FlashList
        data={list}
        keyExtractor={(j) => j.id}
        extraData={[busy, fee.owing]}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24 }}
        refreshControl={refreshControl(jobs.refreshing, () => {
          void jobs.refresh()
          void fee.refresh()
        })}
        renderItem={({ item: j }) => {
          const t = getTemplate(j.templateId)
          const v = getVariant(j.templateId, j.variantId)
          const km = kmTo(j)
          const why = problem(j)
          return (
            <Card style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <Txt w={700} style={{ flex: 1 }}>
                  {t?.name ?? j.templateId}
                  {v ? ` · ${v.label}` : ""}
                  {j.quantity > 1 ? ` × ${j.quantity} người` : ""}
                </Txt>
                <Txt v="lead" w={800} tabular>
                  {formatPrice(j.price * j.quantity)}
                </Txt>
              </View>
              <Txt v="meta" color={colors.inkSoft}>
                {j.time}, {formatDateLong(j.date)} · {j.district}, {j.city}
                {km !== null ? ` · cách ${formatKm(km)}` : ""}
              </Txt>
              {j.description ? <Txt color={colors.inkSoft}>{j.description}</Txt> : null}
              <Txt v="meta" color={colors.muted}>
                {j.customerName} · {j.atHome ? "làm tại nhà khách" : "làm tại studio"}
                {j.quantity > 1 ? ` · ${formatPrice(j.price)}/người` : ""} · phí di chuyển, phí gấp (nếu có) cộng thêm
              </Txt>
              {why ? (
                <Txt v="meta" color={fee.owing && why === OWING_NOTE ? colors.warning : colors.muted}>
                  {why}
                </Txt>
              ) : null}
              <Button label="Nhận việc" size="sm" busy={busy === j.id} disabled={Boolean(why) || Boolean(busy)} onPress={() => void take(j)} />
            </Card>
          )
        }}
        ListHeaderComponent={
          <View style={{ gap: 12, paddingBottom: fee.owing || jobs.error ? 12 : 0 }}>
            {fee.owing ? <FeeCard fee={fee.value} /> : null}
            {jobs.error ? <ErrorNote text={jobs.error} onRetry={() => void jobs.reload()} /> : null}
            {list.length ? (
              <Txt v="meta" color={colors.muted}>
                Giá khách đã chốt. Ai bấm nhận trước được việc, lịch hẹn xác nhận ngay và bạn nhắn tin được với khách.
              </Txt>
            ) : null}
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
              title="Chưa có yêu cầu mới"
              text={scope === "match" ? "Không có yêu cầu nào đúng gói bạn niêm yết và trong phạm vi bạn đi. Có yêu cầu bạn nhận được, 360dep báo ngay." : undefined}
              action={scope === "match" ? "Xem tất cả" : undefined}
              onAction={() => setScope("all")}
            />
          )
        }
      />
    </View>
  )
}

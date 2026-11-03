import { Image } from "expo-image"
import { PhotoBadge, Pill, illustration } from "@/components/tiles"
import * as React from "react"
import { FlashList } from "@shopify/flash-list"
import { router, useIsFocused } from "expo-router"
import { Alert, View } from "react-native"
import { getTemplate, getVariant, travelDistanceKm } from "@/shared"
import { formatDateLong, formatKm, formatPrice } from "@/data/format"
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
  const kmTo = (j: JobItem) => travelDistanceKm(pro.city, pro.district, j.city, j.district)
  const problem = (j: JobItem): string | null => fee.owing ? OWING_NOTE : j.eligibility?.reason ?? (j.eligibility ? null : "Chưa kiểm tra được điều kiện nhận việc.")
  const list = (jobs.value ?? []).filter((j) => !j.mine).filter((j) => scope === "all" || problem(j) === null)

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
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StudioHeader title="Việc mới" subtitle="Ai nhận trước được việc">
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: gutter, paddingTop: 4, paddingBottom: 8 }}>
          <Pill label="Bạn nhận được" selected={scope === "match"} onCanvas={false} onPress={() => setScope("match")} />
          <Pill label="Tất cả" selected={scope === "all"} onCanvas={false} onPress={() => setScope("all")} />
        </View>
      </StudioHeader>
      {!pro.acceptingJobs ? (
        <Txt v="meta" color={colors.warning} style={{ paddingHorizontal: gutter, paddingTop: 12 }}>
          Bạn đang tạm nghỉ nhận lịch. Bật lại ở Hôm nay để nhận việc.
        </Txt>
      ) : null}
      <FlashList
        data={list}
        keyExtractor={(j) => j.id}
        extraData={[busy, fee.owing]}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 20, paddingBottom: 32 }}
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
            <View style={{ marginBottom: 20, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surface, opacity: why ? 0.72 : 1 }}>
              <View style={{ height: 132 }}>
                <Image source={{ uri: illustration(t?.category ?? "nail", j.district.length) }} style={{ flex: 1, backgroundColor: colors.subtle }} contentFit="cover" transition={150} accessible={false} />
                <PhotoBadge text="Ảnh minh hoạ" position="tl" />
              </View>
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
                      <Button label="Nhận việc" size="sm" busy={busy === j.id} disabled={Boolean(busy)} style={{ borderRadius: radius.full, paddingHorizontal: 20 }} onPress={() => void take(j)} />
                    </>
                  )}
                </View>
              </View>
            </View>
          )
        }}
        ListHeaderComponent={
          <View style={{ gap: 12, paddingBottom: fee.owing || jobs.error ? 12 : 0 }}>
            {fee.owing ? <FeeCard fee={fee.value} /> : null}
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

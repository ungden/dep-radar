import * as React from "react"
import { router } from "expo-router"
import { ScrollView, View } from "react-native"
import { listBookings, type BookingItem } from "@/data/bookings"
import { addDays, formatDateLong, formatPrice, localDate, todayISO } from "@/data/format"
import { AcceptingSwitch } from "@/components/accepting-switch"
import { FeeCard, useFee } from "@/components/fee-card"
import { PartnerAppointments } from "@/components/partner-appointments"
import { PendingBookingCard, UpcomingJobCard } from "@/components/partner-cards"
import { BedBoard } from "@/components/bed-board"
import { isSpa, travelDistanceKm } from "@/shared"
import { StudioHeader } from "@/components/studio-header"
import { useApp } from "@/state/app"
import { useNow } from "@/state/keyboard"
import { usePartnerReview } from "@/state/partner-review"
import { useAsync } from "@/state/use-async"
import { colors, gutter, hairline, radius } from "@/theme"
import { Button } from "@/ui/button"
import { Card, ErrorNote, Skeleton } from "@/ui/bits"
import { Icon } from "@/ui/icon"
import { Press } from "@/ui/press"
import { refreshControl } from "@/ui/refresh"
import { Txt } from "@/ui/text"
import { useToast } from "@/ui/toast"

/**
 * The partner's home, in the order they act on it: bookings waiting for an
 * answer, the jobs coming up with the next button to press, then money.
 * Before the profile is live it says what is left instead.
 */
export default function Today() {
  const app = useApp()
  const uid = app.uid
  const pro = app.myPro
  const bookings = useAsync(uid ? () => listBookings(uid, "pro") : null, [uid])
  const fee = useFee(uid)
  const review = usePartnerReview(uid)
  const toast = useToast(112)
  const all = bookings.value ?? []
  const hasPending = all.some((b) => b.status === "pending")
  const now = useNow(true)

  const today = todayISO()
  const monday = addDays(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7))
  const toAccept = all.filter((b) => b.status === "pending").sort((a, b) => a.confirmBy.localeCompare(b.confirmBy))
  const spa = isSpa(pro)
  const upcoming = all
    .filter((b) => (b.status === "confirmed" || b.status === "in_progress") && b.date <= addDays(today, 7))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const later = all.filter((b) => b.status === "confirmed" && b.date > addDays(today, 7)).length
  const week = all.filter((b) => b.status === "completed" && b.completedAt && localDate(b.completedAt) >= monday)
  const kept = week.reduce((sum, b) => sum + b.quote.payout, 0)
  const owed = fee.owing && fee.value ? -fee.value.balance : 0
  const km = (b: BookingItem) => (b.atHome && pro ? travelDistanceKm(pro.city, pro.district, b.city, b.district) : null)

  const accepted = (b: BookingItem) => {
    bookings.setValue((list) => list?.map((x) => (x.id === b.id ? { ...x, status: "confirmed" } : x)))
    toast.show(`Đã nhận lịch của ${b.customer.name}`)
    void bookings.reload()
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StudioHeader title="Hôm nay" subtitle={formatDateLong(today)}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: gutter, paddingTop: 8, paddingBottom: 12 }}>
          {pro?.published ? (
            <>
              <Txt w={600}>{pro.acceptingJobs ? "Đang nhận lịch mới" : "Đang tạm nghỉ"}</Txt>
              <AcceptingSwitch />
            </>
          ) : (
            <Txt w={600}>Hồ sơ chưa hiện với khách</Txt>
          )}
        </View>
      </StudioHeader>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: gutter, paddingTop: 24, paddingBottom: 40, gap: 32 }}
        refreshControl={refreshControl(bookings.refreshing || fee.refreshing, () => {
          void bookings.refresh()
          void fee.refresh()
        })}
      >
        {bookings.error ? <ErrorNote text={bookings.error} onRetry={() => void bookings.reload()} /> : null}

        {pro && !pro.published ? <ProfileState status={review?.status ?? ""} note={review?.note ?? ""} /> : null}

        {fee.owing ? <FeeCard fee={fee.value} /> : null}

        {bookings.loading || toAccept.length ? (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Txt v="title">Cần bạn trả lời</Txt>
              {toAccept.length ? (
                <View style={{ minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 7, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
                  <Txt v="meta" w={700} color={colors.surface} tabular>
                    {toAccept.length}
                  </Txt>
                </View>
              ) : null}
            </View>
            {bookings.loading && !bookings.value ? <Skeleton style={{ height: 200, borderRadius: radius.lg }} /> : null}
            {toAccept.map((b) => (
              <PendingBookingCard key={b.id} booking={b} now={now} km={km(b)} spa={spa} blocked={fee.owing} onAccepted={accepted} onFailed={() => void fee.reload()} />
            ))}
          </View>
        ) : null}

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <Txt v="title">Sắp tới</Txt>
            <Press onPress={() => router.navigate("/studio/lich")} accessibilityRole="link" style={{ minHeight: 32, justifyContent: "center" }}>
              <Txt v="meta" w={600} color={colors.accentDark}>
                Xem lịch
              </Txt>
            </Press>
          </View>
          {spa && pro ? (
            <BedBoard
              beds={pro.beds ?? 1}
              bookings={all.filter((b) => b.date === today)}
              hours={(pro.openingHours ?? []).filter((h) => h.weekday === new Date(`${today}T00:00:00Z`).getUTCDay())}
            />
          ) : null}
          {!bookings.loading && !upcoming.length ? (
            <Txt color={colors.inkSoft}>{hasPending ? "Chưa có lịch đã nhận trong 7 ngày tới." : "7 ngày tới chưa có lịch."}{later ? ` Còn ${later} lịch xa hơn trong tab Lịch.` : ""}</Txt>
          ) : null}
          {upcoming.slice(0, 5).map((b) => (
            <UpcomingJobCard key={b.id} booking={b} now={now} spa={spa} />
          ))}
          {upcoming.length > 5 ? (
            <Txt v="meta" color={colors.muted}>
              Còn {upcoming.length - 5} lịch nữa trong tab Lịch.
            </Txt>
          ) : null}
        </View>

        <PartnerAppointments date={today} reloadKey={bookings.value} />

        <View style={{ gap: 12 }}>
          <Txt v="title">Tiền tuần này</Txt>
          <Press onPress={() => router.push("/vi")} accessibilityRole="button" accessibilityLabel="Mở ví" style={{ backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 18 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 16 }}>
              <View style={{ gap: 2 }}>
                <Txt>Bạn giữ</Txt>
                <Txt v="meta" color={colors.muted}>
                  {week.length} lịch xong từ thứ 2, đã trừ phí
                </Txt>
              </View>
              <Txt v="title" tabular color={colors.accentDark}>
                {formatPrice(kept)}
              </Txt>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderTopWidth: hairline, borderTopColor: colors.line }}>
              <Txt>{owed > 0 ? "Phí cần chuyển 360đẹp" : "Số dư ví"}</Txt>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Txt w={700} tabular color={owed > 0 ? colors.danger : colors.ink}>
                  {fee.value ? formatPrice(owed > 0 ? owed : fee.value.balance) : "—"}
                </Txt>
                <Icon name="right" size={14} color={colors.muted} />
              </View>
            </View>
          </Press>
        </View>
      </ScrollView>
      {toast.element}
    </View>
  )
}

/** Before the profile is live: what is left, or that it is waiting, or what to fix. */
function ProfileState({ status, note }: { status: string; note: string }) {
  const pending = status === "pending"
  const refused = status === "changes_requested" || status === "rejected"
  return (
    <Card style={{ backgroundColor: refused ? colors.warningSoft : colors.surface, gap: 10 }}>
      <Txt v="title" color={refused ? colors.warning : colors.ink}>
        {pending ? "Hồ sơ đang chờ duyệt" : refused ? "Hồ sơ cần sửa" : "Hồ sơ chưa xong"}
      </Txt>
      {pending ? (
        <Txt color={colors.inkSoft}>Thường xong trong 24 giờ, 360đẹp báo bạn ngay. Trong lúc chờ, đăng thêm tác phẩm để khách tin bạn hơn.</Txt>
      ) : refused ? (
        note
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => (
            <Txt key={line} color={colors.warning}>
              • {line}
            </Txt>
          ))
      ) : (
        <Txt color={colors.inkSoft}>Làm nốt các bước rồi gửi duyệt. Khách chỉ thấy bạn sau khi hồ sơ được duyệt.</Txt>
      )}
      {pending ? (
        <Button label="Đăng tác phẩm" icon="plus" variant="secondary" full onPress={() => router.navigate("/studio/dang")} />
      ) : (
        <Button label={refused ? "Sửa và gửi duyệt lại" : "Làm tiếp hồ sơ"} full onPress={() => router.push({ pathname: "/ho-so-doi-tac", params: refused ? { step: "5" } : {} })} />
      )}
    </Card>
  )
}

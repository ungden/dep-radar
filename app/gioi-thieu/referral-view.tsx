"use client"

import * as React from "react"
import Link from "next/link"
import { Gift, PauseCircle, Ticket, UserPlus } from "lucide-react"
import { useNow } from "@/components/booking-extras"
import { ShareLinkCard } from "@/components/booking-link"
import { forgetReferralCode, readReferralCode } from "@/components/referral-capture"
import { Button, ButtonLink, Card, inputClass } from "@/components/ui"
import type { ReferralRewardItem, VoucherItem } from "@/lib/api/types"
import { actions } from "@/lib/client-actions"
import { useApp, useRefresh } from "@/lib/store"
import { PUBLIC_ORIGIN } from "@/lib/working-hours"
import { cn, formatDateLong, formatPrice, localDate } from "@/lib/utils"

const DAY = 86_400_000
const noSubscription = () => () => {}

/**
 * The page behind "Giới thiệu bạn bè": your link, the rules with the amounts
 * the owner set (platform_settings), what it has earned you, and -- for a new
 * account -- the box to enter the code of the friend who invited you.
 */
export function ReferralView({ code, rewards }: { code: string | null; rewards: ReferralRewardItem[] }) {
  const state = useApp()
  const { session, platform } = state
  // Paused (or not live yet): no promises, only what is already yours.
  const paused = (
    <p className="flex gap-2 rounded-[var(--radius-lg)] bg-warning-soft px-4 py-3 text-[14px] text-warning">
      <PauseCircle className="mt-0.5 size-4 shrink-0" />
      <span>Chương trình giới thiệu đang tạm dừng.{session ? " Voucher bạn đã có vẫn dùng được tới hạn." : ""}</span>
    </p>
  )

  if (!session) {
    return (
      <div className="space-y-4">
        {platform.referralEnabled ? (
          <>
            <Intro />
            <Rules />
          </>
        ) : (
          paused
        )}
        <Card className="p-5 text-center">
          <p className="font-semibold">Đăng nhập để lấy link giới thiệu và xem voucher của bạn</p>
          <ButtonLink href="/login?next=%2Fgioi-thieu" className="mt-4">
            Đăng nhập
          </ButtonLink>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {platform.referralEnabled ? (
        <>
          <Intro />
          {code ? (
            <ShareLinkCard
              url={`${PUBLIC_ORIGIN}/?ref=${code}`}
              title={`Mã giới thiệu của bạn: ${code}`}
              text="Gửi link này cho bạn bè. Họ mở link rồi đăng nhập, hoặc nhập mã trong 30 ngày đầu."
              shareTitle="Dùng 360dep cùng mình: đặt người làm đẹp, chụp ảnh gần bạn"
              qrFile={`360dep-gioi-thieu-${code}.png`}
            />
          ) : (
            <p className="rounded-[var(--radius-lg)] bg-subtle px-4 py-3 text-[14px] text-ink-soft">
              Chưa lấy được mã giới thiệu của bạn. Tải lại trang sau ít phút.
            </p>
          )}
          <ClaimCode />
          <Rules />
        </>
      ) : (
        paused
      )}
      <Rewards rewards={rewards} />
      <Vouchers vouchers={state.vouchers} />
    </div>
  )
}

function Intro() {
  const { platform } = useApp()
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-subtle text-accent">
        <Gift className="size-5" />
      </span>
      <div>
        <p className="text-[17px] font-bold tracking-tight">Rủ bạn bè dùng 360dep</p>
        <p className="mt-0.5 text-[14px] text-ink-soft">
          {platform.referralCustomerAmount > 0
            ? `Khi bạn bè dùng dịch vụ lần đầu, cả hai cùng nhận voucher ${formatPrice(platform.referralCustomerAmount)}.`
            : "Khi bạn bè dùng dịch vụ lần đầu, cả hai cùng nhận ưu đãi."}{" "}
          Không có thưởng chỉ vì đăng ký: ưu đãi đến khi bạn bè thật sự dùng 360dep.
        </p>
      </div>
    </div>
  )
}

/** The rules as the database applies them (supabase/migrations/20260925100300_referrals.sql). */
function Rules() {
  const { platform: p } = useApp()
  // Before the referral migration there are no amounts to quote.
  if (!p.referralCustomerAmount && !p.referralProAmount) return null
  return (
    <section>
      <h2 className="text-[17px] font-bold tracking-tight">Cách tính</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-ink-soft">
        <li>
          Bạn bè <b className="text-ink">đặt lịch</b>: khi lịch hẹn đầu tiên từ {formatPrice(p.referralMinTotal)} của họ hoàn thành, cả hai nhận
          voucher {formatPrice(p.referralCustomerAmount)}, dùng trong {p.voucherDays} ngày.
        </li>
        <li>
          Bạn bè <b className="text-ink">nhận khách</b> trên 360dep: khi họ xong 3 job cho 3 khách khác nhau, cả hai nhận{" "}
          {formatPrice(p.referralProAmount)}: cộng vào ví nếu là người làm, hoặc một voucher cùng giá trị.
        </li>
        <li>Bạn bè mở link của bạn rồi đăng nhập, hoặc tự nhập mã trong 30 ngày đầu, trước khi dùng dịch vụ lần nào.</li>
        <li>
          Mỗi người bạn tính một lần, trong 90 ngày kể từ khi nhập mã. Lịch hẹn giữa bạn và chính người bạn đó không tính
          {p.referralMonthlyCap > 0 ? `. Tối đa ${p.referralMonthlyCap} lượt thưởng mỗi tháng cho một người giới thiệu` : ""}.
        </li>
        <li>
          Voucher dùng cho lịch hẹn từ {formatPrice(p.referralMinTotal)}, chọn trong chi tiết lịch hẹn trước giờ hẹn. Bạn trả người làm ít hơn;
          360dep trả phần voucher cho người làm khi xong. Lịch bị huỷ thì voucher được trả lại.
        </li>
      </ul>
    </section>
  )
}

/** A new account can still say who invited them: once, in the first 30 days. */
function ClaimCode() {
  const { referral } = useApp()
  const refresh = useRefresh()
  const now = useNow(60_000)
  // A code kept from a friend's link fills the box; the server render has none.
  const stored = React.useSyncExternalStore(
    noSubscription,
    () => readReferralCode() ?? "",
    () => "",
  )
  const [typed, setTyped] = React.useState<string | null>(null)
  const code = typed ?? stored
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  if (done) return <p className="rounded-[var(--radius-lg)] bg-success-soft px-4 py-3 text-[14px] text-success">Đã nhận lời giới thiệu từ {done}.</p>
  // Null before the referral migration, or signed out; the rest is the database's rule.
  if (!referral || referral.referredBy) return null
  if (now - Date.parse(referral.joinedAt) > 30 * DAY) return null

  return (
    <form
      className="rounded-[var(--radius-lg)] border border-line bg-surface p-4"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        const result = await actions.claimReferral(code)
        setBusy(false)
        if ("error" in result) return setError(result.error)
        forgetReferralCode()
        setDone(result.name)
        refresh()
      }}
    >
      <p className="flex items-center gap-2 text-[15px] font-bold">
        <UserPlus className="size-4" /> Bạn được bạn bè giới thiệu?
      </p>
      <p className="mt-0.5 text-[13px] text-ink-soft">Nhập mã của họ. Chỉ nhập được một lần, trong 30 ngày đầu.</p>
      <div className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(e) => setTyped(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
          aria-label="Mã giới thiệu"
          placeholder="VD: K7M2QA"
          autoCapitalize="characters"
          className={cn(inputClass, "min-w-0 flex-1 font-semibold tracking-[0.2em]")}
        />
        <Button type="submit" disabled={busy || code.length !== 6}>
          Nhập mã
        </Button>
      </div>
      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
    </form>
  )
}

function Rewards({ rewards }: { rewards: ReferralRewardItem[] }) {
  return (
    <section>
      <h2 className="text-[17px] font-bold tracking-tight">Thưởng giới thiệu</h2>
      {rewards.length === 0 ? (
        <p className="mt-1.5 text-[14px] text-ink-soft">Chưa có lượt thưởng nào. Thưởng hiện ở đây khi bạn bè dùng dịch vụ lần đầu.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {rewards.map((r, i) => (
            <li key={`${r.createdAt}-${i}`} className="flex items-center gap-3 px-4 py-3 text-[14px]">
              <span className="min-w-0 flex-1">
                <span className="block">
                  {r.iInvited
                    ? r.kind === "pro"
                      ? "Người làm bạn giới thiệu đã xong 3 job"
                      : "Bạn bè bạn giới thiệu đã dùng dịch vụ lần đầu"
                    : r.kind === "pro"
                      ? "Quà giới thiệu: bạn đã xong 3 job đầu tiên"
                      : "Quà lần đầu dùng 360dep qua lời giới thiệu"}
                </span>
                <span className="block text-xs text-muted">{formatDateLong(localDate(r.createdAt), true)}</span>
              </span>
              <span className="font-semibold text-success">+{formatPrice(r.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Vouchers({ vouchers }: { vouchers: VoucherItem[] }) {
  const now = useNow(60_000)
  return (
    <section>
      <h2 className="text-[17px] font-bold tracking-tight">Voucher của bạn</h2>
      {vouchers.length === 0 ? (
        <p className="mt-1.5 text-[14px] text-ink-soft">Chưa có voucher nào.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {vouchers.map((v) => {
            const status = v.usedAt
              ? { text: `Đã dùng ${formatDateLong(localDate(v.usedAt))}`, muted: true }
              : v.bookingId
                ? { text: "Đang dùng cho một lịch hẹn", muted: false }
                : Date.parse(v.expiresAt) <= now
                  ? { text: "Đã hết hạn", muted: true }
                  : { text: `Hạn ${formatDateLong(localDate(v.expiresAt), true)}`, muted: false }
            return (
              <li key={v.id}>
                <Card className={cn("flex items-center gap-3 p-3.5", status.muted && "opacity-60")}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-subtle text-accent">
                    <Ticket className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold">−{formatPrice(v.amount)}</span>
                    <span className="block text-xs text-ink-soft">
                      {v.minTotal > 0 ? `Cho lịch hẹn từ ${formatPrice(v.minTotal)} · ` : ""}
                      {status.text}
                    </span>
                    {v.note && <span className="block truncate text-xs text-muted">{v.note}</span>}
                  </span>
                  {v.bookingId && !v.usedAt && (
                    <Link href={`/bookings/${v.bookingId}`} className="shrink-0 text-[13px] font-semibold text-accent underline underline-offset-2">
                      Xem lịch
                    </Link>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
      <p className="mt-2 text-xs text-muted">Dùng voucher trong chi tiết lịch hẹn, trước giờ hẹn.</p>
    </section>
  )
}

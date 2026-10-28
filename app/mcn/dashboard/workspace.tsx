"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarClock, ExternalLink, Handshake, Plus, Search, Users } from "lucide-react"
import { RequireSession } from "@/components/require-session"
import { Sheet } from "@/components/sheet"
import { Button, ButtonLink, Card, EmptyState, Field, inputClass, PageHeader } from "@/components/ui"
import { applyMcn, inviteMcnPro, removeMcnPro, saveMcnSupport } from "@/lib/api/mcn"
import type { McnApplication, McnMembership, McnOrganization, McnWorkspace } from "@/lib/mcn-types"
import { cn, formatPrice } from "@/lib/utils"
import { McnFeedback, McnMemberBadge, McnSplit, McnStatusBadge, McnUnavailable, mcnDate, useMcnAction, type McnAction } from "../common"
import { McnLedger } from "../ledger"

export function McnDashboard({ workspace }: { workspace: McnWorkspace }) {
  const action = useMcnAction()
  const organizations = workspace.organizations.filter((o) => o.isOwner)
  const [selectedId, setSelectedId] = useState(organizations[0]?.id ?? "")
  const organization = organizations.find((o) => o.id === selectedId) ?? organizations[0]
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-10 md:pt-4">
      <PageHeader title="Network của bạn" back="/mcn" />
      <RequireSession>
        <McnFeedback value={action.feedback} />
        {!workspace.available ? <McnUnavailable error={workspace.error} /> : <>
          {organizations.length > 1 && <Field label="Chọn network"><select className={inputClass} value={organization?.id ?? ""} onChange={(e) => setSelectedId(e.target.value)}>{organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></Field>}
          {organization ? <><NetworkWorkspace key={organization.id} organization={organization} workspace={workspace} action={action} />{organization.status === "rejected" && <ApplicationForm key={organization.id} action={action} initial={organization} />}</> : <ApplicationForm action={action} />}
        </>}
        <div className="flex flex-wrap gap-4 text-meta"><Link href="/mcn" className="text-accent underline underline-offset-4">Cách hợp tác & chia doanh thu</Link>{workspace.isPro && <Link href="/studio/network" className="text-accent underline underline-offset-4">Network của tôi với vai trò KTV</Link>}</div>
      </RequireSession>
    </div>
  )
}

function ApplicationForm({ action, initial }: { action: McnAction; initial?: McnOrganization }) {
  const [consent, setConsent] = useState(false)
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const fields = ["name", "legalName", "taxId", "contactPhone", "city", "description", "bankName", "bankAccount", "bankHolder"] as const
    const input = Object.fromEntries(fields.map((key) => [key, String(data.get(key) ?? "").trim()])) as unknown as McnApplication
    await action.run(() => applyMcn(input), "Đã gửi hồ sơ. 360đẹp sẽ xét duyệt trước khi network có thể mời KTV.")
  }
  return <>
    <div><p className="eyebrow">Trở thành đối tác phát triển</p><h2 className="mt-2 text-[28px] font-bold tracking-tight">{initial ? "Bổ sung & gửi lại hồ sơ" : "Đăng ký network MCN"}</h2><p className="mt-3 max-w-2xl text-body leading-relaxed text-ink-soft">Dành cho tổ chức tuyển chọn, hướng dẫn và hỗ trợ đội ngũ KTV. Thông tin pháp lý và tài khoản nhận tiền giúp 360đẹp xác minh, ký kết và đối soát đúng bên.</p></div>
    <McnSplit />
    <form onSubmit={(e) => void submit(e)} className="space-y-6">
      <Card className="space-y-4 p-5 md:p-6">
        <h3 className="text-lead font-bold">Thông tin tổ chức</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tên network"><input name="name" defaultValue={initial?.name ?? ""} required minLength={3} maxLength={100} className={inputClass} placeholder="Tên KTV sẽ nhìn thấy" autoComplete="organization" /></Field>
          <Field label="Tên pháp lý"><input name="legalName" defaultValue={initial?.legalName ?? ""} required minLength={3} maxLength={200} className={inputClass} placeholder="Theo hồ sơ đăng ký của tổ chức" /></Field>
          <Field label="Mã số thuế"><input name="taxId" defaultValue={initial?.taxId ?? ""} required minLength={10} maxLength={14} pattern={"[0-9\\-]{10,14}"} className={inputClass} placeholder="Mã số thuế tổ chức" /></Field>
          <Field label="Số điện thoại người phụ trách"><input name="contactPhone" defaultValue={initial?.contactPhone ?? ""} required type="tel" minLength={9} maxLength={16} pattern={"\\+?[0-9]{9,15}"} className={inputClass} autoComplete="tel" /></Field>
          <Field label="Tỉnh / thành phố hoạt động"><input name="city" defaultValue={initial?.city ?? ""} required minLength={2} maxLength={100} className={inputClass} autoComplete="address-level1" placeholder="VD: TP. Hồ Chí Minh" /></Field>
        </div>
        <Field label="Bạn sẽ tuyển chọn và hỗ trợ KTV như thế nào?" hint="Nêu nhóm nghề, khu vực, quy mô dự kiến, cách hướng dẫn và người hỗ trợ khi có vấn đề."><textarea name="description" defaultValue={initial?.description ?? ""} required minLength={20} maxLength={2000} rows={4} className={inputClass} /></Field>
      </Card>
      <Card className="space-y-4 p-5 md:p-6">
        <h3 className="text-lead font-bold">Tài khoản nhận tiền đối soát</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ngân hàng"><input name="bankName" defaultValue={initial?.bankName ?? ""} required minLength={2} maxLength={100} className={inputClass} placeholder="Tên ngân hàng" /></Field>
          <Field label="Số tài khoản"><input name="bankAccount" defaultValue={initial?.bankAccount ?? ""} required inputMode="numeric" pattern="[0-9]{6,30}" maxLength={30} className={inputClass} /></Field>
          <Field label="Tên chủ tài khoản" className="sm:col-span-2"><input name="bankHolder" defaultValue={initial?.bankHolder ?? ""} required minLength={3} maxLength={200} className={inputClass} placeholder="Tên chủ tài khoản trên ngân hàng" /></Field>
        </div>
      </Card>
      <label className="flex items-start gap-3 rounded-xl border border-line p-4 text-meta leading-relaxed"><input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-5 shrink-0 accent-[var(--color-accent)]" /><span>Tôi có quyền đại diện tổ chức, xác nhận thông tin chính xác và đồng ý cơ chế chia phí nêu trên. Network không thu phí gia nhập hoặc phí MCN thêm từ KTV, không nhận tiền hay quản lý tài khoản ngân hàng thay KTV. Mọi thành viên phải tự đồng ý gia nhập.</span></label>
      <Button type="submit" disabled={!consent || action.busy}>{action.busy ? "Đang gửi…" : "Gửi hồ sơ xét duyệt"}<ArrowRight className="size-4" aria-hidden /></Button>
    </form>
  </>
}

function NetworkWorkspace({ organization, workspace, action }: { organization: McnOrganization; workspace: McnWorkspace; action: McnAction }) {
  const [slug, setSlug] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("current")
  const [support, setSupport] = useState<McnMembership | null>(null)
  const [remove, setRemove] = useState<McnMembership | null>(null)
  const members = workspace.memberships.filter((m) => m.organizationId === organization.id)
  const commissions = workspace.commissions.filter((c) => c.organizationId === organization.id)
  const payouts = workspace.payouts.filter((p) => p.organizationId === organization.id)
  const active = organization.status === "approved"
  const matching = members.filter((m) => (filter === "all" || (filter === "current" ? ["active", "invited"].includes(m.status) : m.status === filter)) && `${m.proName} ${m.proSlug}`.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi")))
  return <>
    <Card className="p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Không gian quản lý</p><h2 className="mt-2 text-[28px] font-bold tracking-tight">{organization.name}</h2><p className="mt-1 text-meta text-muted">{organization.city} · {organization.legalName}</p></div><McnStatusBadge status={organization.status} /></div>
      {organization.reviewNote && <p className="mt-4 rounded-xl bg-subtle px-4 py-3 text-meta leading-relaxed"><strong>Thông tin từ 360đẹp: </strong>{organization.reviewNote}</p>}
      {!active && <p className="mt-4 text-meta leading-relaxed text-ink-soft">{organization.status === "pending" ? "Hồ sơ đang được xét duyệt. Khi được duyệt, bạn có thể gửi lời mời KTV từ trang này." : "Network hiện chưa thể mời KTV hoặc nhận đối soát. Liên hệ hỗ trợ nếu cần bổ sung hoặc điều chỉnh hồ sơ."}</p>}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[
        ["KTV đang đồng hành", String(members.filter((m) => m.status === "active").length)],
        ["Lời mời đang chờ", String(members.filter((m) => m.status === "invited").length)],
        ["Đủ điều kiện đối soát", formatPrice(commissions.filter((c) => c.eligible).reduce((sum, c) => sum + c.amount, 0))],
        ["Đã chuyển khoản", formatPrice(payouts.reduce((sum, p) => sum + p.amount, 0))],
      ].map(([label, value]) => <div key={label} className="rounded-xl bg-subtle p-3"><p className="text-label text-muted">{label}</p><p className="mt-1 break-words text-xl font-bold tabular-nums">{value}</p></div>)}</div>
    </Card>
    <section aria-labelledby="mcn-team" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2"><h2 id="mcn-team" className="text-xl font-bold">Đội ngũ KTV</h2><Link href="/pros" className="inline-flex min-h-11 items-center gap-1.5 text-meta font-semibold text-accent underline underline-offset-4">Tìm KTV trên sàn <ExternalLink className="size-3.5" aria-hidden /></Link></div>
      {active && <Card className="p-5"><form className="flex flex-col items-start gap-3 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); void action.run(() => inviteMcnPro(organization.id, slug.trim()), "Đã gửi lời mời. KTV cần tự xác nhận trong Network của tôi.").then((ok) => { if (ok) setSlug("") }) }}><Field label="Mã hồ sơ KTV" hint="Phần cuối địa chỉ hồ sơ /pros/…; KTV cần tạo hồ sơ trước." className="w-full flex-1"><input value={slug} onChange={(e) => setSlug(e.target.value)} required maxLength={100} placeholder="VD: nguyen-thi-lan" className={inputClass} autoCapitalize="none" autoCorrect="off" /></Field><Button type="submit" disabled={action.busy || !slug.trim()} className="sm:mb-6"><Plus className="size-4" aria-hidden />Gửi lời mời</Button></form></Card>}
      <div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Tìm thành viên</span><Search className="absolute left-3.5 top-4 size-5 text-muted" aria-hidden /><input className={cn(inputClass, "pl-11")} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên hoặc mã hồ sơ" /></label><label><span className="sr-only">Trạng thái thành viên</span><select className={inputClass} value={filter} onChange={(e) => setFilter(e.target.value)}><option value="current">Đang hoạt động & chờ</option><option value="active">Đang đồng hành</option><option value="invited">Chờ xác nhận</option><option value="all">Toàn bộ lịch sử</option></select></label></div>
      {matching.length ? <ul className="space-y-3">{matching.map((member) => <li key={member.id}><Card className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-body font-bold">{member.proName}</h3><p className="mt-1 break-all text-label text-muted">{member.proSlug} · {member.city}</p></div><McnMemberBadge status={member.status} /></div>
        <p className="mt-3 text-meta text-ink-soft">{member.status === "active" ? `${member.published ? "Hồ sơ đã mở" : "Hồ sơ đang ẩn"} · ${member.acceptingJobs ? "Đang nhận khách" : "Tạm nghỉ nhận khách"} · ${member.completedJobs} lịch hoàn thành` : member.status === "invited" ? `Lời mời hết hạn ${mcnDate(member.expiresAt)}` : `Kết thúc ${mcnDate(member.endedAt)}`}</p>
        {member.supportNote && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-subtle p-3 text-meta leading-relaxed">{member.supportNote}</p>}
        {member.nextFollowUp && <p className="mt-2 flex items-center gap-1.5 text-label text-accent"><CalendarClock className="size-3.5" aria-hidden />Hẹn chăm sóc: {mcnDate(member.nextFollowUp)}</p>}
        <div className="mt-3 flex flex-wrap gap-2"><ButtonLink href={`/pros/${encodeURIComponent(member.proSlug)}`} variant="outline" size="sm">Hồ sơ công khai <ExternalLink className="size-3.5" aria-hidden /></ButtonLink>{member.status === "active" && active && <><Button size="sm" variant="soft" disabled={action.busy} onClick={() => setSupport(member)}>Ghi chú hỗ trợ</Button><Button size="sm" variant="ghost" disabled={action.busy} onClick={() => setRemove(member)}>Kết thúc hợp tác</Button></>}</div>
      </Card></li>)}</ul> : <Card><EmptyState icon={<Users className="size-6" />} title={members.length ? "Không có thành viên phù hợp" : "Bắt đầu từ một KTV phù hợp"} text={members.length ? "Thử tên khác hoặc đổi bộ lọc trạng thái." : "KTV được mời tự quyết định tham gia. Network chỉ có thành viên sau khi họ đồng ý."} /></Card>}
    </section>
    <McnLedger commissions={commissions} payouts={payouts} />
    <Card className="p-5"><p className="flex items-center gap-2 font-bold"><Handshake className="size-5 text-accent" aria-hidden />Thông tin đối soát</p><p className="mt-3 text-body">{organization.bankName} · {organization.bankAccount}</p><p className="mt-1 text-meta text-muted">{organization.bankHolder}</p><p className="mt-3 text-meta leading-relaxed text-ink-soft">360đẹp đối soát thủ công từ 100.000đ đủ điều kiện. Khoản cần thu hồi từ kỳ trước sẽ được trừ trước khi chuyển tiền. Liên hệ hỗ trợ để cập nhật thông tin pháp lý hoặc tài khoản nhận tiền.</p><Link href="/tro-giup" className="mt-3 inline-block text-meta font-semibold text-accent underline underline-offset-4">Liên hệ hỗ trợ</Link></Card>
    <McnSplit compact />
    {support && <SupportSheet key={support.id} member={support} action={action} onClose={() => setSupport(null)} />}
    <Sheet open={Boolean(remove)} onClose={() => { if (!action.busy) setRemove(null) }} title="Kết thúc hợp tác với KTV"><p className="text-body leading-relaxed">Kết thúc hợp tác với <strong>{remove?.proName}</strong>? Những lịch tạo sau khi kết thúc sẽ không chia hoa hồng cho network. Những lịch đã ghi nhận vẫn theo điều khoản đã lưu.</p><p className="mt-3 text-meta text-muted">Hồ sơ, khách hàng và tiền của KTV vẫn do KTV quản lý.</p><McnFeedback value={action.feedback?.error ? action.feedback : null} /><div className="mt-5 flex flex-wrap gap-2"><Button variant="danger" disabled={action.busy} onClick={() => { if (remove) void action.run(() => removeMcnPro(remove.id), "Đã kết thúc hợp tác. Điều khoản các lịch đã tạo được giữ nguyên.").then((ok) => { if (ok) setRemove(null) }) }}>Xác nhận kết thúc</Button><Button variant="outline" disabled={action.busy} onClick={() => setRemove(null)}>Giữ hợp tác</Button></div></Sheet>
  </>
}

function SupportSheet({ member, action, onClose }: { member: McnMembership; action: McnAction; onClose: () => void }) {
  const [note, setNote] = useState(member.supportNote)
  const [date, setDate] = useState(member.nextFollowUp?.slice(0, 10) ?? "")
  return <Sheet open onClose={() => { if (!action.busy) onClose() }} title={`Hỗ trợ ${member.proName}`}><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void action.run(() => saveMcnSupport(member.id, note.trim(), date || null), "Đã lưu ghi chú hỗ trợ.").then((ok) => { if (ok) onClose() }) }}><Field label="Ghi chú hỗ trợ" hint="Ghi lại việc cần hướng dẫn và cam kết hỗ trợ. Không lưu CCCD, mật khẩu hay thông tin khách hàng."><textarea className={inputClass} rows={5} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} /></Field><Field label="Ngày hẹn chăm sóc tiếp" hint="Tuỳ chọn, dùng để theo dõi trong danh sách thành viên."><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} /></Field><McnFeedback value={action.feedback?.error ? action.feedback : null} /><Button type="submit" disabled={action.busy}>{action.busy ? "Đang lưu…" : "Lưu ghi chú"}</Button></form></Sheet>
}

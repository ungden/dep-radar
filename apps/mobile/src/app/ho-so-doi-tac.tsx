import { STUDIO_BOOKING_OPEN } from "@/shared"
import * as React from "react"
import { router, useFocusEffect, useLocalSearchParams } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { webLink } from "@/data/links"
import { ActivityIndicator, ScrollView, TextInput, View } from "react-native"
import { allowsPackageNote, CATEGORIES, CITIES, districtsOf, getTemplate, PACKAGE_NOTE_MAX, partnerTemplatesByCategory, perUnitSuffix, tierLabels, PRICE_LEVEL_NOTE, PARTNER_STEPS, partnerProgress, DEFAULT_WORKING_WINDOWS, IDENTITY_VERIFICATION_OPEN, PARTNER_PLEDGE, type PartnerSetup, type CategoryId } from "@/shared"
import { rpc, supabase } from "@/data/supabase"
import { useApp } from "@/state/app"
import { colors, gutter, radius, fonts } from "@/theme"
import { WardPicker } from "@/components/ward-picker"
import { TimeField } from "@/components/time-field"
import { Button } from "@/ui/button"
import { Txt } from "@/ui/text"
import { Press } from "@/ui/press"
import { formatPrice } from "@/data/format"

export default function PartnerProfile() {
  const app = useApp()
  const params = useLocalSearchParams<{ step?: string }>()
  const [step, setStep] = React.useState(Math.min(5, Math.max(0, Number(params.step) || 0)))
  const [setup, setSetup] = React.useState<PartnerSetup | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [bio, setBio] = React.useState("")
  const [categories, setCategories] = React.useState<CategoryId[]>([])
  const [city, setCity] = React.useState(CITIES[0])
  const [district, setDistrict] = React.useState("")
  const [home, setHome] = React.useState(!STUDIO_BOOKING_OPEN)
  const [studio, setStudio] = React.useState("")
  const [radiusKm, setRadiusKm] = React.useState("10")
  const [equipment, setEquipment] = React.useState("")
  const [hours, setHours] = React.useState<{ weekday: number; start: string; end: string }[]>([])
  const [agree, setAgree] = React.useState(false)
  const [editing, setEditing] = React.useState<string | null>(null)
  const [prices, setPrices] = React.useState<Record<string, number>>({})
  // The partner's own words on each package (makeup); empty means the catalogue's "Bao gồm".
  const [notes, setNotes] = React.useState<Record<string, string>>({})
  const scroller = React.useRef<ScrollView>(null)
  const cardY = React.useRef<Record<string, number>>({})
  const load = React.useCallback(async (initial = false) => {
    const r = await rpc<PartnerSetup>("partner_setup", {})
    if (!r.ok) { setError(r.error); return }
    setSetup(r.data)
    if (initial && r.data.profile) {
      const p = r.data.profile
      setTitle(p.title); setBio(p.bio); setCategories(p.categories); setCity(p.city); setDistrict(p.district)
      setHome(!STUDIO_BOOKING_OPEN || p.home_service); setStudio(p.studio_address ?? ""); setRadiusKm(String(p.max_travel_km)); setEquipment(p.equipment ?? "")
      setHours(r.data.hours.map((h) => ({ weekday: h.weekday, start: timeLabel(h.startMin), end: timeLabel(h.endMin) })))
    }
  }, [])
  React.useEffect(() => { if (app.uid) void load(true) }, [app.uid, load])
  useFocusEffect(React.useCallback(() => { if (app.uid) void load() }, [app.uid, load]))
  const mutate = async (fn: string, args: Record<string, unknown>, next?: number): Promise<boolean> => {
    setBusy(true); setError(null)
    try {
      const r = await rpc(fn, args)
      if (!r.ok) { setError(r.error); return false }
      await load(); await app.refresh()
      if (next !== undefined) setStep(next)
      return true
    } catch { setError("Không lưu được. Thông tin đang nhập vẫn giữ nguyên; thử lại khi có mạng."); return false }
    finally { setBusy(false) }
  }
  const hideProfile = async () => {
    setBusy(true); setError(null)
    try {
      const { error } = await supabase.from("pros").update({ published: false }).eq("id", app.uid!)
      if (error) setError(error.message)
      else { await load(); await app.refresh() }
    } catch { setError("Không lưu được. Thử lại khi có mạng.") }
    finally { setBusy(false) }
  }
  if (!app.uid) return <View style={{ padding: gutter, gap: 12 }}><Txt>Đăng nhập để tạo hồ sơ đối tác.</Txt><Button label="Đăng nhập" onPress={() => router.push("/login")} /></View>
  if (!app.me.account?.phone) return <View style={{ padding: gutter, gap: 12 }}><Txt>Thêm số điện thoại để khách liên hệ sau khi bạn nhận lịch.</Txt><Button label="Thêm số điện thoại" onPress={() => router.push("/so-dien-thoai")} /></View>
  if (!setup) return <View style={{ padding: gutter, gap: 12 }}>{error ? <><Txt color={colors.danger}>{error}</Txt><Button label="Thử lại" onPress={() => void load(true)} /></> : <ActivityIndicator />}</View>
  const tpl = editing ? getTemplate(editing) : null
  const steps = partnerProgress(setup)
  const offered = categories.flatMap((c) => partnerTemplatesByCategory(c))
  // Opening a service starts at its top; saving it comes back to it in the list.
  const openService = (id: string) => {
    setEditing(id)
    setPrices({ ...(setup.services.find((s) => s.template_id === id)?.prices ?? {}) })
    setNotes({ ...(setup.services.find((s) => s.template_id === id)?.notes ?? {}) })
    scroller.current?.scrollTo({ y: 0, animated: false })
  }
  const backToList = (id: string | null) => {
    setEditing(null)
    setTimeout(() => scroller.current?.scrollTo({ y: Math.max(0, (id ? cardY.current[id] ?? 0 : 0) - 12), animated: true }), 60)
  }
  return <ScrollView ref={scroller} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" style={{ backgroundColor: colors.canvas }} contentContainerStyle={{ padding: gutter, paddingBottom: 80, gap: 18 }}>
    <Txt v="h2">Hồ sơ đối tác</Txt>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{PARTNER_STEPS.map((label, i) => <Choice key={label} label={`${steps[i].done ? "✓" : i + 1} ${label}`} active={step === i} disabled={busy || (!setup.profile && i > 0)} onPress={() => { setStep(i); setEditing(null) }} />)}</View>
    {error && <Txt color={colors.danger}>{error}</Txt>}
    {step === 0 && <>
      <Txt color={colors.inkSoft}>Chọn đúng các nghề bạn cung cấp. Bỏ nghề sẽ tạm ẩn dịch vụ thuộc nghề đó.</Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{CATEGORIES.map((c) => <Choice key={c.id} label={c.label + (c.vertical === "model" ? " · sắp mở" : "")} disabled={busy || c.vertical === "model"} active={categories.includes(c.id)} onPress={() => setCategories((s) => s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id])} />)}</View>
      <Field label="Dòng giới thiệu" value={title} onChange={setTitle} />
      <Txt w={700}>Thành phố</Txt><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{CITIES.map((c) => <Choice key={c} label={c} active={city === c} onPress={() => { setCity(c); if (!districtsOf(c).includes(district)) setDistrict("") }} />)}</View>
      <Txt w={700}>Phường / xã nơi bạn làm</Txt><WardPicker city={city} value={district} onChange={(choice) => { setCity(choice.city); setDistrict(choice.district) }} />
      <Button label="Lưu & chọn dịch vụ" busy={busy} disabled={!categories.length || title.trim().length < 3 || !districtsOf(city).includes(district)} onPress={() => void mutate(setup.profile ? "save_partner_profile" : "create_partner", setup.profile ? { p_profile: { categories, city, district, title } } : { p_categories: categories, p_city: city, p_district: district, p_title: title }, 1)} />
    </>}
    {step === 1 && <>
      <Txt color={colors.inkSoft}>{PRICE_LEVEL_NOTE} Chỉ bật những gói bạn thực hiện được.</Txt>
      {!tpl ? offered.map((t) => {
        const service = setup.services.find((s) => s.template_id === t.id)
        // What they offer, at what price, without opening each one.
        const chosen = t.variants.filter((v) => service?.prices[v.id] !== undefined)
        return (
          <View key={t.id} onLayout={(e) => { cardY.current[t.id] = e.nativeEvent.layout.y }} style={{ padding: 14, gap: 8, backgroundColor: colors.surface, borderRadius: radius.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Txt w={700} style={{ flex: 1 }}>{t.name}</Txt>
              {t.addon ? <Txt v="meta" color={colors.muted}>Đặt kèm</Txt> : null}
              {service && !service.active ? <Txt v="meta" color={colors.warning}>Đang ẩn</Txt> : null}
            </View>
            {chosen.length ? (
              <View style={{ gap: 4 }}>
                {chosen.map((v) => {
                  const price = service!.prices[v.id]
                  const level = tierLabels(v)[v.tiers.indexOf(price)]
                  return (
                    <View key={v.id} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                      <Txt v="meta" color={colors.inkSoft} style={{ flex: 1 }}>✓ {v.label}</Txt>
                      <Txt v="meta" w={600}>{level ? `${level} · ` : ""}{formatPrice(price)}{perUnitSuffix(v)}</Txt>
                    </View>
                  )
                })}
              </View>
            ) : (
              <Txt v="meta" color={colors.muted}>Chưa chọn gói nào</Txt>
            )}
            <Button label={chosen.length ? "Sửa gói & giá" : "Chọn gói & giá"} variant="secondary" onPress={() => openService(t.id)} />
            {service && <Button label={service.active ? "Tạm ẩn dịch vụ" : "Bật dịch vụ"} variant="ghost" busy={busy} onPress={() => void mutate("save_pro_service", { p_template: t.id, p_prices: service.prices, p_active: !service.active })} />}
          </View>
        )
      }) : <>
        <Txt v="h2">{tpl.name}</Txt><Txt>{tpl.description}</Txt><Txt>{tpl.includes.join(" · ")}</Txt>{tpl.addon && <Txt v="meta" color={colors.inkSoft}>Khách chọn thêm khi đặt dịch vụ chính, không đặt riêng.</Txt>}
        {tpl.variants.map((v) => <View key={v.id} style={{ gap: 10, padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md }}><Choice label={`${prices[v.id] !== undefined ? "✓" : "+"} ${v.label}`} active={prices[v.id] !== undefined} onPress={() => setPrices((p) => { const next = { ...p }; if (next[v.id] !== undefined) delete next[v.id]; else next[v.id] = v.tiers[0]; return next })} /><Txt v="meta">{v.durationMin} phút{v.unit ? ` · giá mỗi ${v.unit}` : v.perPerson ? v.durationRule === "fixed" ? " / nhóm" : " / người" : ""}{v.sessions ? ` · ${v.sessions} buổi` : ""} {v.deliverable ?? tpl.deliverable}{v.revisions ? ` · ${v.revisions} lượt sửa` : ""}{v.followupDays ? ` · dặm trong ${v.followupDays} ngày` : ""}</Txt>{prices[v.id] !== undefined && <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{v.tiers.map((n, i) => <Choice key={n} label={`${tierLabels(v)[i]} ${formatPrice(n)}${perUnitSuffix(v)}`} active={prices[v.id] === n} onPress={() => setPrices((p) => ({ ...p, [v.id]: n }))} />)}</View>}{prices[v.id] !== undefined && allowsPackageNote(tpl) ? <PackageNote value={notes[v.id] ?? ""} onChange={(text) => setNotes((m) => ({ ...m, [v.id]: text }))} fallback={tpl.includes.join(", ")} /> : null}</View>)}
        <Button label="Lưu gói & giá" busy={busy} disabled={!Object.keys(prices).length} onPress={async () => { if (await mutate("save_pro_service", { p_template: tpl.id, p_prices: prices, p_active: true, ...(allowsPackageNote(tpl) ? { p_notes: Object.fromEntries(Object.keys(prices).map((id) => [id, (notes[id] ?? "").trim()])) } : {}) })) backToList(tpl.id) }} />
        <Button label="Về danh sách dịch vụ" variant="ghost" onPress={() => backToList(tpl.id)} />
      </>}
      <Button label="Tiếp tục: nơi phục vụ" variant="secondary" onPress={() => { setEditing(null); setStep(2) }} />
    </>}
    {step === 2 && <>
      {STUDIO_BOOKING_OPEN ? <Choice label={home ? "✓ Nhận tại nhà / địa điểm khách" : "Nhận tại nhà / địa điểm khách"} active={home} onPress={() => setHome(!home)} /> : <Txt>Nhận lịch freelancer đến nhà hoặc địa điểm khách chọn.</Txt>}
      <Field label="Bán kính phục vụ (1–30 km)" value={radiusKm} onChange={setRadiusKm} numeric />
      {STUDIO_BOOKING_OPEN && <Field label="Địa chỉ studio (nếu có)" value={studio} onChange={setStudio} />}
      <Field label="Giới thiệu" value={bio} onChange={setBio} multiline />
      <Field label="Thiết bị / vật tư bạn sử dụng" value={equipment} onChange={setEquipment} />
      <Button label="Lưu & chọn giờ làm" busy={busy} disabled={(!home && !studio.trim()) || !Number.isFinite(Number(radiusKm)) || Number(radiusKm) < 1 || Number(radiusKm) > 30} onPress={() => void mutate("save_partner_profile", { p_profile: { homeService: home, studioAddress: studio, maxTravelKm: Number(radiusKm), bio, equipment } }, 3)} />
    </>}
    {step === 3 && <>
      <Txt color={colors.inkSoft}>Giờ bên dưới chỉ có hiệu lực khi bấm lưu. Có thể thêm nhiều khoảng trong một ngày.</Txt>
      {hours.map((h, i) => <View key={i} style={{ gap: 8 }}><Txt w={700}>{h.weekday === 0 ? "Chủ nhật" : `Thứ ${h.weekday + 1}`}</Txt><TimeField label="Bắt đầu" value={h.start} onChange={(x) => setHours((s) => s.map((w, n) => n === i ? { ...w, start: x } : w))} /><TimeField allowEndOfDay label="Kết thúc" value={h.end} onChange={(x) => setHours((s) => s.map((w, n) => n === i ? { ...w, end: x } : w))} /><Button label="Bỏ khoảng giờ" variant="ghost" onPress={() => setHours((s) => s.filter((_, n) => n !== i))} /></View>)}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{[1, 2, 3, 4, 5, 6, 0].map((d) => <Button key={d} label={`+ ${d === 0 ? "CN" : `T${d + 1}`}`} variant="secondary" size="sm" onPress={() => setHours((s) => [...s, { weekday: d, start: "09:00", end: "19:00" }])} />)}</View>
      {!hours.length && <Button label="Dùng giờ gợi ý T2–T7, 9–19h" variant="secondary" onPress={() => setHours(DEFAULT_WORKING_WINDOWS.map((h) => ({ weekday: h.weekday, start: timeLabel(h.startMin), end: timeLabel(h.endMin) })))} />}
      <Button label="Xác nhận & lưu giờ làm" busy={busy} disabled={!hours.length || hours.some((h) => !/^\d{2}:\d{2}$/.test(h.start) || !/^\d{2}:\d{2}$/.test(h.end) || !Number.isFinite(minutes(h.start)) || !Number.isFinite(minutes(h.end)) || minutes(h.start) >= minutes(h.end))} onPress={() => void mutate("confirm_partner_hours", { p_windows: hours.map((h) => ({ weekday: h.weekday, startMin: minutes(h.start), endMin: minutes(h.end) })) }, 4)} />
    </>}
    {step === 4 && <><Txt>Bạn đã có {setup.workCount} tác phẩm hợp lệ. Đăng ảnh công việc thực tế để khách xem trước khi đặt.</Txt><Button label="Đăng tác phẩm" onPress={() => router.push("/studio/dang")} /><Button label="Cập nhật số tác phẩm" variant="secondary" onPress={() => void load()} /><Button label="Tiếp tục: gửi duyệt" onPress={() => setStep(5)} /></>}
    {step === 5 && <>
      <Txt w={700}>{setup.profile?.published ? "Hồ sơ đang hiển thị" : setup.profile?.review_status === "pending" ? "Đang chờ duyệt" : "Kiểm tra & gửi duyệt"}</Txt>
      {setup.profile?.published && !setup.profile.accepting_jobs && <Txt color={colors.warning}>Bạn đang tạm nghỉ nhận khách. Bật “Nhận lịch mới” trong Quản lý đối tác khi sẵn sàng.</Txt>}
      {setup.profile?.review_note && <Txt color={colors.warning}>{setup.profile.review_note}</Txt>}
      {steps.slice(0, 5).map((s, i) => <Choice key={s.label} label={`${s.done ? "✓" : "Còn thiếu:"} ${s.label}`} active={s.done} onPress={() => setStep(i)} />)}
      {/* Identity is asked before the profile is shown once it opens (lib/launch.ts on the web); the check itself runs on the web. */}
      {IDENTITY_VERIFICATION_OPEN && <Choice
        label={setup.profile?.identity_status === "verified" ? "✓ Xác minh danh tính" : setup.profile?.identity_status === "pending" ? "Xác minh danh tính: đang chờ duyệt" : "Còn thiếu: Xác minh danh tính (CCCD + ảnh cầm CCCD)"}
        active={setup.profile?.identity_status === "verified"}
        onPress={() => void WebBrowser.openBrowserAsync(webLink("/studio/verify"))}
      />}
      <Button label="Nhận tiền & mã QR (mở trên web)" variant="ghost" onPress={() => void WebBrowser.openBrowserAsync(webLink("/studio/thanh-toan"))} />
      <Button label="Đọc chính sách phí, nhận việc & hủy lịch" variant="ghost" onPress={() => void WebBrowser.openBrowserAsync(webLink("/chinh-sach"))} />
      <Button label="Đọc Quy chế: dịch vụ bị cấm" variant="ghost" onPress={() => void WebBrowser.openBrowserAsync(webLink("/quy-che#bi-cam"))} />
      <Choice label={`Tôi đồng ý chính sách và Quy chế. ${PARTNER_PLEDGE}`} active={agree} onPress={() => setAgree(!agree)} />
      <Button label="Gửi hồ sơ để duyệt" busy={busy} disabled={!agree || steps.slice(0, 5).some((s) => !s.done) || setup.profile?.review_status === "pending"} onPress={() => void mutate("submit_partner_profile", { p_agree: agree })} />
      {setup.profile?.published && <Button label="Tạm ẩn hồ sơ" variant="secondary" busy={busy} onPress={() => void hideProfile()} />}
      <Button label="Về quản lý đối tác" variant="secondary" onPress={() => router.replace("/studio")} />
    </>}
  </ScrollView>
}
function timeLabel(m: number) { return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}` }
function minutes(s: string) { const [h, m] = s.split(":").map(Number); return h >= 0 && h <= 24 && m >= 0 && m < 60 && (h < 24 || m === 0) ? h * 60 + m : NaN }
function PackageNote({ value, onChange, fallback }: { value: string; onChange: (s: string) => void; fallback: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Txt v="meta" w={600}>Gói của bạn có gì (không bắt buộc)</Txt>
      <TextInput
        accessibilityLabel="Gói của bạn có gì"
        value={value}
        onChangeText={onChange}
        maxLength={PACKAGE_NOTE_MAX}
        multiline
        placeholder={`Để trống thì khách thấy: ${fallback}`}
        placeholderTextColor={colors.muted}
        style={{ fontSize: 15, minHeight: 64, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, color: colors.ink, fontFamily: fonts[400], backgroundColor: colors.surface, textAlignVertical: "top" }}
      />
      <Txt v="meta" color={colors.muted}>Vd: loại mi, dặm lại trong tiệc, phụ kiện tóc. Không ghi số điện thoại hay link. {value.length}/{PACKAGE_NOTE_MAX}</Txt>
    </View>
  )
}

function Field({ label, value, onChange, numeric, multiline }: { label: string; value: string; onChange: (s: string) => void; numeric?: boolean; multiline?: boolean }) { return <View style={{ gap: 6 }}><Txt v="meta" w={600}>{label}</Txt><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} keyboardType={numeric ? "numeric" : "default"} multiline={multiline} style={{ fontSize: 17, minHeight: 48, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, color: colors.ink, fontFamily: fonts[400], backgroundColor: colors.surface }} /></View> }
function Choice({ label, active, disabled, onPress }: { label: string; active?: boolean; disabled?: boolean; onPress: () => void }) { return <Press accessibilityLabel={label} accessibilityRole="button" accessibilityState={{ selected: active, disabled }} disabled={disabled} onPress={onPress} style={{ minHeight: 44, justifyContent: "center", padding: 12, borderWidth: 1, borderColor: active ? colors.accent : colors.line, backgroundColor: active ? colors.accentSoft : colors.surface, borderRadius: radius.md }}><Txt v="meta" color={active ? colors.accent : colors.ink}>{label}</Txt></Press> }

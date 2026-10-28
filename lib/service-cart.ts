import { getTemplate, getVariant,verticalOf } from './catalog'

/** A scope belongs to a recipient, never to the person paying for the order. */
export interface CartItem {
  site?: SiteFacilities
  template: string
  variant: string
  quantity: number
  recipient?: string
  region?: 'hand' | 'foot' | 'both'
}
export interface CartContractLine extends CartItem {
  name: string
  label: string
  unit: string
  unitPrice: number
  total: number
  durationMin: number
  includes: string[]
  serviceSetup?: ServiceSetup | null
  scope?: string
  discount?: number
  deliverable?: string | null
}
export function cartRegion(item: CartItem): string[] {
  if (item.region === 'both' || item.variant === 'hand-foot') return ['hand', 'foot']
  return [item.region ?? (item.template === 'nail-pedicure' ? 'foot' : 'hand')]
}
export function cartConflict(a: CartItem, b: CartItem): string | null {
  if ((a.recipient?.trim() || 'Mình') !== (b.recipient?.trim() || 'Mình')) return null
  const x = getTemplate(a.template), y = getTemplate(b.template)
  if (!x || !y) return 'Dịch vụ không còn được cung cấp.'
  if (x.category === 'nail' && y.category === 'nail' && !cartRegion(a).some(r => cartRegion(b).includes(r))) return null
  if (a.template === 'nail-prep-pilot' && b.template === 'nail-prep-pilot' && a.variant !== b.variant) {
    return a.variant.startsWith('remove') === b.variant.startsWith('remove') ? 'Chọn một cách tháo hoặc một nền cho vùng móng.' : null
  }
  if (a.template === 'skin-wax' && b.template === 'skin-wax' && a.variant !== b.variant) {
    const overlap = [['half-leg','full-leg'],['half-arm','arm']].some(group => group.includes(a.variant) && group.includes(b.variant))
    return overlap ? 'Chọn cả vùng hoặc nửa vùng cho cùng người.' : null
  }
  if (a.template === b.template && (!['nail-design','nail-art-pilot'].includes(a.template) || a.variant === b.variant)) return 'Chọn một lựa chọn cho cùng người và phạm vi; đổi lựa chọn hoặc chọn người/vùng khác.'
  if ([a,b].some(item=>item.template==='nail-pilot'&&item.variant==='cat-eye')&&[a,b].some(item=>item.template==='nail-art-pilot'&&item.variant==='cat-eye')) return 'Mắt mèo đã bao gồm trong gói màu này.'
  if ([a,b].some(item=>['nail-extension','nail-refill'].includes(item.template))&&[a,b].some(item=>item.template==='nail-prep-pilot'&&!item.variant.startsWith('remove'))) return 'Nền nối móng đã nằm trong dịch vụ chính.'
  const colors = ['nail-gel', 'nail-extension', 'nail-refill', 'nail-manicure', 'nail-pilot']
  if (colors.includes(a.template) && colors.includes(b.template)) return 'Phần màu hoặc nền đã bao gồm. Chọn một dịch vụ nền cho vùng móng này.'
  if (x.category === 'makeup' && y.category === 'makeup' && ![a.template, b.template].some(t => ['makeup-hair-updo', 'makeup-takecare'].includes(t))) return 'Mỗi người chọn một layout makeup cho một buổi.'
  if ([a.template, b.template].includes('makeup-bridal') && [a.template, b.template].some(t => ['makeup-hair-updo', 'hair-bridal'].includes(t))) return 'Tóc cô dâu đã bao gồm trong makeup cô dâu.'
  if ([a.template,b.template].every(t => ['brow-tint','brow-lamination','brow-shaping','brow-tattoo'].includes(t))) return 'Tỉa hoặc nhuộm mày đã nằm trong quy trình. Chọn một kỹ thuật mày.'
  if ([a.template,b.template].every(t => ['lash-classic','lash-volume','lash-design','lash-refill','lash-lift'].includes(t))) return 'Chọn một kỹ thuật chính cho mi; tháo mi cũ có thể chọn riêng.'
  if (x.category === 'massage' && y.category === 'massage') return 'Chọn một kỹ thuật và thời lượng massage cho mỗi người.'
  if (x.category === 'skincare' && y.category === 'skincare' && a.template !== 'skin-wax' && b.template !== 'skin-wax') return 'Chọn một quy trình chăm sóc mặt cho mỗi người.'
  if (a.template === 'skin-wax' && b.template === 'skin-wax') return 'Chọn từng vùng wax riêng; không đặt hai biến thể trùng vùng.'
  return null
}
export function validateCart(items: CartItem[]): string | null {
  if (!items.length || items.length > 40) return 'Chọn từ 1 đến 40 dòng dịch vụ.'
  if (getTemplate(items[0].template)?.addon) return 'Chọn dịch vụ chính trước các món bổ sung.'
  for (let i = 0; i < items.length; i++) {
    const a = items[i], v = getVariant(a.template, a.variant)
    if (a.variant==='hand-foot'&&a.region&&a.region!=='both') return 'Gói tay và chân phải giữ đủ hai vùng.'
    if (a.region === 'both' && a.variant !== 'hand-foot') return 'Chọn riêng tay và chân cho mỗi dòng dịch vụ.'
    if (!v || !Number.isInteger(a.quantity) || a.quantity < (v.minQuantity ?? 1) || a.quantity > (v.maxQuantity ?? 1)) return 'Số lượng hoặc dịch vụ không hợp lệ.'
    if (i > 0 && (v.sessions ?? 1) > 1) return 'Chọn gói nhiều buổi làm dịch vụ chính.'
    for (const b of items.slice(0, i)) { const error = cartConflict(a, b); if (error) return error }
  }
  for (const item of items.filter(i => ['nail-design','nail-art-pilot'].includes(i.template))) {
    if (!items.some(base => ['nail-gel','nail-extension','nail-refill','nail-pilot'].includes(base.template) && (base.recipient?.trim() || 'Mình') === (item.recipient?.trim() || 'Mình') && cartRegion(base).some(r => cartRegion(item).includes(r)))) return 'Trang trí cần nền gel phù hợp cho cùng người và vùng móng.'
  }
  return null
}

export interface PricedCartItem extends CartItem { unitPrice: number; quotedUnitPrice?: number; quotedMinutes?: number; scope?: string }
export function requestedCart(items: PricedCartItem[]) {
  const error = validateCart(items) ?? (items.some(item => !getVariant(item.template,item.variant)?.tiers.includes(item.unitPrice)) ? 'Chọn mức giá hợp lệ cho từng món.' : null)
  return { error, total: items.reduce((n,item) => n + cartItemTotal(item,item.unitPrice),0), durationMin: items.reduce((n,item) => { const v=getVariant(item.template,item.variant); return n+(v ? v.durationMin*(v.durationRule==='per_person'?item.quantity:1):0) },0) }
}

export function cartItemTotal(item: CartItem,unitPrice:number) { return item.template==='nail-art-pilot'&&item.variant==='cat-eye'?Math.min(40000,unitPrice*item.quantity):unitPrice*item.quantity }
export function cartHasMedia(items: CartItem[]) {return items.some(item=>{const t=getTemplate(item.template);return t&&verticalOf(t.category)!=='beauty'})}
export type SiteFacilities=Partial<Record<'electricity'|'water'|'table'|'bed',boolean>>
export interface ServiceSetup { equipmentConfirmed:boolean; needs:SiteFacilities; note:string;confirmedAt?:string }
export const SITE_LABELS={electricity:'Điện',water:'Nước',table:'Bàn/ghế phù hợp',bed:'Giường hoặc chỗ nằm phù hợp'} as const

/** Shopping sections follow the order work is performed. */
export function cartMenuGroup(template:string):{rank:number;label:string} {
 if (getTemplate(template)?.category!=='nail') return {rank:4,label:'Dịch vụ khác cùng buổi'}
 if (['nail-removal','nail-pedicure','nail-manicure'].includes(template)) return {rank:0,label:'Chuẩn bị và chăm sóc'}
 if (['nail-prep-pilot','nail-extension','nail-refill'].includes(template)) return {rank:1,label:'Nền và nối móng'}
 if (['nail-gel','nail-pilot'].includes(template)) return {rank:2,label:'Màu'}
 return {rank:3,label:'Trang trí · chọn số ngón hoặc số viên'}
}

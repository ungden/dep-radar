import { getTemplate, getVariant, serviceDuration, serviceQuantity } from "./catalog"
import type { PriceQuote } from "./types"

/**
 * Several services of one Artist in one appointment. The database keeps each
 * line as a booking chained after the main one and has the last word on every
 * rule here (partner_private.cart_lines in 20261106100000); these only spare the
 * customer a refusal, and fold the lines back into one appointment on screen.
 */
export interface CartLine {
  templateId: string
  variantId: string
  quantity: number
}

export const CART_MAX_LINES = 10

/** These all include polishing the same nails, so a cart holds one of them. */
const NAIL_FINISH = ["nail-gel", "nail-extension", "nail-manicure", "nail-refill"]

export const cartLineKey = (line: Pick<CartLine, "templateId" | "variantId">) => `${line.templateId}/${line.variantId}`

/** How many a line starts with: a whole hand for what is priced per finger or stone. */
export function cartDefaultQuantity(templateId: string, variantId: string): number {
  const variant = getVariant(templateId, variantId)
  if (!variant) return 1
  return serviceQuantity(variant, variant.unit ? 10 : 1)
}

/** Main services in the order chosen, then what can only come on top of them. */
export function cartOrder<T extends Pick<CartLine, "templateId">>(lines: T[]): T[] {
  const addon = (line: T) => Boolean(getTemplate(line.templateId)?.addon)
  return [...lines.filter((line) => !addon(line)), ...lines.filter(addon)]
}

/** Why this cart cannot be booked, in the server's words; null when it can. */
export function cartProblem(lines: CartLine[]): string | null {
  if (lines.length === 0) return "Chọn ít nhất một món."
  if (lines.length > CART_MAX_LINES) return `Mỗi lịch tối đa ${CART_MAX_LINES} món.`
  const seen = new Set<string>()
  const mains = new Set<string>()
  const categories = new Set<string>()
  for (const line of cartOrder(lines)) {
    const template = getTemplate(line.templateId)
    const variant = getVariant(line.templateId, line.variantId)
    if (!template || !variant) return "Có món không còn được cung cấp."
    if (template.addon && !categories.has(template.category)) return `"${template.name}" cần đi kèm một dịch vụ chính.`
    if ((variant.sessions ?? 1) > 1 && lines.length > 1) return "Gói nhiều buổi cần đặt riêng."
    if (seen.has(cartLineKey(line))) return "Mỗi món chỉ chọn một lần."
    if (!template.addon && mains.has(template.id)) return "Mỗi dịch vụ chọn một gói."
    seen.add(cartLineKey(line))
    if (!template.addon) mains.add(template.id)
    categories.add(template.category)
  }
  if (lines.filter((line) => NAIL_FINISH.includes(line.templateId)).length > 1) {
    return "Các món này đều đã gồm sơn móng, chọn một món thôi."
  }
  return null
}

/**
 * The cart after tapping a service. Another package of the same main service
 * replaces the one chosen; taking a main service away takes what only came on
 * top of it. Returns the problem instead when the tap cannot be honoured.
 */
export function toggleCartLine(lines: CartLine[], templateId: string, variantId: string): { lines: CartLine[] } | { problem: string } {
  const key = cartLineKey({ templateId, variantId })
  if (lines.some((line) => cartLineKey(line) === key)) return { lines: withoutOrphans(lines.filter((line) => cartLineKey(line) !== key)) }
  const addon = Boolean(getTemplate(templateId)?.addon)
  const others = addon ? lines : lines.filter((line) => line.templateId !== templateId)
  const next = [...others, { templateId, variantId, quantity: cartDefaultQuantity(templateId, variantId) }]
  const problem = cartProblem(next)
  return problem ? { problem } : { lines: withoutOrphans(next) }
}

function withoutOrphans(lines: CartLine[]): CartLine[] {
  const categories = new Set(lines.filter((line) => !getTemplate(line.templateId)?.addon).map((line) => getTemplate(line.templateId)?.category))
  return lines.filter((line) => {
    const template = getTemplate(line.templateId)
    return !template?.addon || categories.has(template.category)
  })
}

export function cartMinutes(lines: CartLine[]): number {
  return lines.reduce((sum, line) => {
    const variant = getVariant(line.templateId, line.variantId)
    return sum + (variant ? serviceDuration(variant, line.quantity) : 0)
  }, 0)
}

/** What the database takes in p_items. */
export const cartItems = (lines: CartLine[]) =>
  cartOrder(lines).map((line) => ({ template: line.templateId, variant: line.variantId, quantity: line.quantity }))

/** A line of an appointment already booked, as the customer and the partner see it. */
export interface BookedLine {
  id: string
  serviceName: string
  variantLabel: string
  quantity: number
  durationMin: number
  servicePrice: number
}

interface Foldable {
  id: string
  serviceName: string
  variantLabel: string
  quantity: number
  durationMin: number
  quote: PriceQuote
  /** Only set on a line of a cart: add-ons made during a visit stay bookings of their own. */
  cartParentId?: string | null
  lines?: BookedLine[]
  endsAt?: string
  startsAt?: string
}

const bookedLine = (b: Foldable): BookedLine => ({
  id: b.id,
  serviceName: b.serviceName,
  variantLabel: b.variantLabel,
  quantity: b.quantity,
  durationMin: b.durationMin,
  servicePrice: b.quote.servicePrice,
})

/**
 * One appointment per cart: the lines disappear into their main booking, whose
 * time and money become the whole appointment's. A line whose main booking is
 * not in the list stays as it is, so it can still be opened.
 */
export function foldCartLines<T extends Foldable>(bookings: T[]): T[] {
  const present = new Set(bookings.map((b) => b.id))
  const byParent = new Map<string, T[]>()
  for (const b of bookings) {
    if (b.cartParentId && present.has(b.cartParentId)) byParent.set(b.cartParentId, [...(byParent.get(b.cartParentId) ?? []), b])
  }
  return bookings
    .filter((b) => !(b.cartParentId && present.has(b.cartParentId)))
    .map((b) => {
      const extra = byParent.get(b.id)
      if (!extra) return b
      const chain = [...extra].sort((x, y) => (x.startsAt ?? "").localeCompare(y.startsAt ?? ""))
      const add = (pick: (q: PriceQuote) => number) => chain.reduce((sum, line) => sum + pick(line.quote), pick(b.quote))
      return {
        ...b,
        lines: [b, ...chain].map(bookedLine),
        variantLabel: `${b.variantLabel} + ${chain.length} món`,
        durationMin: chain.reduce((sum, line) => sum + line.durationMin, b.durationMin),
        endsAt: chain[chain.length - 1].endsAt ?? b.endsAt,
        quote: {
          ...b.quote,
          servicePrice: add((q) => q.servicePrice),
          total: add((q) => q.total),
          commission: add((q) => q.commission),
          payout: add((q) => q.payout),
        },
      }
    })
}

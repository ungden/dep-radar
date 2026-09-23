"use client"

import * as React from "react"
import * as api from "./api/actions"
import * as auth from "./auth/actions"
import { useAnnounce } from "@/components/live-region"
import { useRefresh } from "./store"
import type {
  BookingStatus,
  CastingCompensation,
  CategoryId,
  CustomerAddress,
  ModelProfile,
  PaymentMethod,
  UsageScope,
  WorkEventKind,
} from "./types"
import { toTimestamptz } from "./utils"

/**
 * What a button calls.
 *
 * Every method here goes to a server action, which calls a database function that
 * re-checks the rule. Nothing decides anything on this side, so a reply is either
 * `{}` on success or `{ error }` with a sentence the screen can show -- being told
 * "Khung giờ này đã có lịch khác" is a normal answer, not a crash.
 */
export type Result = { error?: string }

const done: Result = {}

const asResult = (r: { ok: true } | { ok: false; error: string }): Result => (r.ok ? done : { error: r.error })

export const actions = {
  async signOut() {
    await auth.signOut()
  },

  async switchRole(role: "customer" | "pro") {
    await auth.switchRole(role)
  },

  async setCity(city: string | null) {
    await api.setBrowsingCity(city)
  },

  async toggleSaveWork(workSlug: string): Promise<Result> {
    return asResult(await api.toggleSavedWork(workSlug))
  },

  async toggleFollow(proSlug: string): Promise<Result> {
    return asResult(await api.toggleFollow(proSlug))
  },

  async saveAddress(
    address: CustomerAddress & { id?: string; label?: string; note?: string; isDefault?: boolean },
  ): Promise<{ id: string } | { error: string }> {
    const result = await api.saveAddress({
      id: address.id,
      label: address.label ?? "Nhà",
      city: address.city,
      district: address.district,
      detail: address.detail,
      note: address.note,
      isDefault: address.isDefault ?? true,
    })
    return result.ok ? { id: result.data } : { error: result.error }
  },

  /** Which start times the freelancer can actually take on a day. */
  async slotsFor(input: {
    proId: string
    templateId: string
    variantId: string
    quantity?: number
    date: string
    atHome: boolean
    addressId: string | null
  }) {
    return api.fetchSlots(input)
  },

  async deleteAddress(id: string): Promise<Result> {
    return asResult(await api.deleteAddress(id))
  },

  // Bookings ------------------------------------------------------------------

  async createBooking(input: {
    proId: string
    templateId: string
    variantId: string
    date: string
    time: string
    atHome: boolean
    addressId: string | null
    quantity?: number
    note: string
    paymentMethod: PaymentMethod
  }): Promise<{ id: string } | { error: string }> {
    const result = await api.createBooking({
      proId: input.proId,
      templateId: input.templateId,
      variantId: input.variantId,
      startsAt: toTimestamptz(input.date, input.time),
      atHome: input.atHome,
      addressId: input.addressId,
      quantity: input.quantity ?? 1,
      note: input.note,
      paymentMethod: input.paymentMethod,
    })
    return result.ok ? { id: result.data } : { error: result.error }
  },

  /** The freelancer's job card and the customer's booking card both use this. */
  async setBookingStatus(id: string, status: BookingStatus, reason = ""): Promise<Result> {
    switch (status) {
      case "confirmed":
        return asResult(await api.confirmBooking(id))
      case "in_progress":
        return asResult(await api.startBooking(id))
      case "completed":
        return asResult(await api.completeBooking(id))
      case "declined":
        return asResult(await api.declineBooking(id, reason))
      case "no_show":
        return asResult(await api.markNoShow(id, reason))
      case "cancelled":
        return asResult(await api.cancelBooking(id, reason))
      default:
        return { error: "Không thể chuyển sang trạng thái này." }
    }
  },

  async requestReschedule(bookingId: string, date: string, time: string): Promise<Result> {
    return asResult(await api.requestReschedule(bookingId, toTimestamptz(date, time)))
  },

  async respondReschedule(bookingId: string, accept: boolean): Promise<Result> {
    return asResult(await api.respondReschedule(bookingId, accept))
  },

  // Requests & offers ---------------------------------------------------------

  async createJob(input: {
    templateId: string
    variantId: string
    date: string
    time: string
    atHome: boolean
    addressId: string | null
    quantity?: number
    description: string
    paymentMethod: PaymentMethod
  }): Promise<{ id: string } | { error: string }> {
    const result = await api.postJob({
      templateId: input.templateId,
      variantId: input.variantId,
      startsAt: toTimestamptz(input.date, input.time),
      atHome: input.atHome,
      addressId: input.addressId,
      quantity: input.quantity ?? 1,
      description: input.description,
      paymentMethod: input.paymentMethod,
    })
    return result.ok ? { id: result.data } : { error: result.error }
  },

  async closeJob(jobId: string): Promise<Result> {
    return asResult(await api.closeJob(jobId))
  },

  async sendOffer(jobId: string, price: number, message: string): Promise<Result> {
    return asResult(await api.sendOffer(jobId, price, message))
  },

  async withdrawOffer(jobId: string): Promise<Result> {
    return asResult(await api.withdrawMyOfferOn(jobId))
  },

  async acceptOffer(offerId: string): Promise<{ id: string } | { error: string }> {
    const result = await api.acceptOffer(offerId)
    return result.ok ? { id: result.data } : { error: result.error }
  },

  // Freelancer profile & listings ---------------------------------------------

  async saveProService(templateId: string, prices: Record<string, number>, active = true): Promise<Result> {
    return asResult(await api.saveListing({ templateId, prices, active }))
  },

  async toggleProService(templateId: string, prices: Record<string, number>, active: boolean): Promise<Result> {
    return asResult(await api.saveListing({ templateId, prices, active }))
  },

  async removeProService(templateId: string): Promise<Result> {
    return asResult(await api.removeListing(templateId))
  },

  async setAcceptingJobs(value: boolean): Promise<Result> {
    return asResult(await api.setAcceptingJobs(value))
  },

  // Reviews -------------------------------------------------------------------

  async submitReview(
    bookingId: string,
    input: { rating: number; tags: string[]; text: string; photos?: string[] },
  ): Promise<Result> {
    return asResult(
      await api.writeReview({
        bookingId,
        rating: input.rating,
        tags: input.tags,
        body: input.text,
        photos: input.photos,
      }),
    )
  },

  /** A review is identified by the booking it belongs to. */
  async replyReview(bookingId: string, text: string): Promise<Result> {
    return asResult(await api.replyReview(bookingId, text))
  },

  /** The freelancer's review of the customer, once, after a completed job. */
  async reviewCustomer(bookingId: string, rating: number, text = ""): Promise<Result> {
    return asResult(await api.reviewCustomer(bookingId, rating, text))
  },

  // Photo & video: terms, delivery, combos --------------------------------------

  async setBookingTerms(bookingId: string, usageScope: UsageScope, consentRepost: boolean): Promise<Result> {
    return asResult(await api.setBookingTerms(bookingId, usageScope, consentRepost))
  },

  async deliverBooking(bookingId: string, url: string, note = ""): Promise<Result> {
    return asResult(await api.deliverBooking(bookingId, url, note))
  },

  async acceptDelivery(bookingId: string): Promise<Result> {
    return asResult(await api.acceptDelivery(bookingId))
  },

  /** Two or three bookings made together. Returns the combo's id. */
  async linkBookings(bookingIds: string[]): Promise<{ id: string } | { error: string }> {
    const result = await api.linkBookings(bookingIds)
    return result.ok ? { id: result.data } : { error: result.error }
  },

  // Profile by trade ------------------------------------------------------------

  async setEquipment(equipment: string): Promise<Result> {
    return asResult(await api.setEquipment(equipment))
  },

  async saveModelProfile(profile: ModelProfile): Promise<Result> {
    return asResult(await api.saveModelProfile(profile))
  },

  // Feed ------------------------------------------------------------------------

  /**
   * Fire and forget: what the feed showed and what was tapped. Not for useAct --
   * it must not refresh the page, and a lost batch is not worth telling anyone.
   * `work` is the post's dbId (or its slug).
   */
  logWorkEvents(events: { work: string; kind: WorkEventKind }[]): void {
    if (!events.length) return
    api.logWorkEvents(events).catch(() => undefined)
  },

  async setInterests(categories: CategoryId[]): Promise<Result> {
    return asResult(await api.setInterests(categories))
  },

  // Casting calls ("Tuyển mẫu") -------------------------------------------------

  async createCasting(input: {
    category: CategoryId
    title: string
    description: string
    date: string
    time: string
    city: string
    district: string
    slots: number
    compensation: CastingCompensation
    discountPercent?: number
    fee?: number
  }): Promise<{ id: string } | { error: string }> {
    const result = await api.createCasting({
      category: input.category,
      title: input.title,
      description: input.description,
      startsAt: toTimestamptz(input.date, input.time),
      city: input.city,
      district: input.district,
      slots: input.slots,
      compensation: input.compensation,
      discountPercent: input.discountPercent ?? null,
      fee: input.fee ?? null,
    })
    return result.ok ? { id: result.data } : { error: result.error }
  },

  async closeCasting(castingId: string): Promise<Result> {
    return asResult(await api.closeCasting(castingId))
  },

  async applyCasting(castingId: string, message: string): Promise<{ id: string } | { error: string }> {
    const result = await api.applyCasting(castingId, message)
    return result.ok ? { id: result.data } : { error: result.error }
  },

  async withdrawApplication(applicationId: string): Promise<Result> {
    return asResult(await api.withdrawApplication(applicationId))
  },

  /** Accepting opens a chat with the applicant; `threadId` is it. */
  async decideApplication(applicationId: string, accept: boolean): Promise<Result & { threadId?: string | null }> {
    const result = await api.decideApplication(applicationId, accept)
    return result.ok ? { threadId: result.data ?? null } : { error: result.error }
  },
}

/**
 * Run a write, then re-read the page so the screen shows the database's answer.
 * Returns the error sentence when there is one, so a caller can display it, and
 * announces the outcome for anyone not watching the pixels change.
 */
export function useAct() {
  const refresh = useRefresh()
  const announce = useAnnounce()
  return React.useCallback(
    async (run: () => Promise<Result | { id: string } | { error: string }>, done?: string) => {
      const result = await run()
      refresh()
      const error = "error" in result && result.error ? result.error : null
      announce(error ?? done ?? "")
      return error
    },
    [refresh, announce],
  )
}

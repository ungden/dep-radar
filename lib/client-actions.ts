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
import { addDays, toTimestamptz } from "./utils"

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

  /**
   * Which days from `from` (yyyy-mm-dd) have at least one bookable start time,
   * for up to 21 days. Same inputs and rules as slotsFor.
   */
  async freeDays(input: {
    proId: string
    templateId: string
    variantId: string
    quantity?: number
    from: string
    days?: number
    atHome: boolean
    addressId: string | null
  }): Promise<string[]> {
    return api.freeDays(input)
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

  /** The customer disputes a no-show report, within 24 hours of it. */
  async disputeNoShow(bookingId: string, reason: string): Promise<Result> {
    return asResult(await api.disputeNoShow(bookingId, reason))
  },

  /** The customer closes the job themselves ("Xác nhận đã xong"). */
  async confirmBookingDone(bookingId: string): Promise<Result> {
    return asResult(await api.confirmBookingDone(bookingId))
  },

  /** The customer reports that the freelancer did not come. Cancels the booking on them. */
  async reportProNoShow(bookingId: string, detail = ""): Promise<Result> {
    return asResult(await api.reportProNoShow(bookingId, detail.trim()))
  },

  async applyVoucher(bookingId: string, voucherId: string): Promise<Result> {
    return asResult(await api.applyVoucher(bookingId, voucherId))
  },

  async removeVoucher(bookingId: string): Promise<Result> {
    return asResult(await api.removeVoucher(bookingId))
  },

  /** Returns the name of the friend whose code it was. */
  async claimReferral(code: string): Promise<{ name: string } | { error: string }> {
    const result = await api.claimReferral(code)
    return result.ok ? { name: result.data } : { error: result.error }
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
    /** Per person; omitted means the catalogue price. */
    price?: number | null
  }): Promise<{ id: string } | { error: string }> {
    const result = await api.postJob({
      price: input.price,
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

  /** Freelancer: take a request. Returns the booking it became. */
  async takeJob(jobId: string): Promise<{ id: string } | { error: string }> {
    const result = await api.takeJob(jobId)
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

  /**
   * Busy time on one day, Vietnam time. `to` may be "24:00" for the end of the
   * day; a `to` at or before `from` is refused here, before the database says so.
   */
  async addTimeBlock(input: { date: string; from: string; to: string; note?: string }): Promise<Result> {
    const endsAt = input.to === "24:00" ? toTimestamptz(addDays(input.date, 1), "00:00") : toTimestamptz(input.date, input.to)
    const startsAt = toTimestamptz(input.date, input.from)
    if (endsAt <= startsAt) return { error: "Giờ kết thúc phải sau giờ bắt đầu." }
    return asResult(await api.addTimeBlock({ startsAt, endsAt, note: input.note }))
  },

  async removeTimeBlock(id: string): Promise<Result> {
    return asResult(await api.removeTimeBlock(id))
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

  // Safety & devices --------------------------------------------------------------

  /** An account id, or a freelancer's slug. Stops messages both ways. */
  async blockUser(account: string): Promise<Result> {
    return asResult(await api.blockUser(account))
  },

  async unblockUser(account: string): Promise<Result> {
    return asResult(await api.unblockUser(account))
  },

  /** The Expo push token of this device, after sign-in. */
  async registerPushToken(token: string, platform: "ios" | "android" | "web"): Promise<Result> {
    return asResult(await api.registerPushToken(token, platform))
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

"use client"

import * as React from "react"
import * as api from "./api/actions"
import * as auth from "./auth/actions"
import { useAnnounce } from "@/components/live-region"
import { useRefresh } from "./store"
import type { BookingStatus, CategoryId, CustomerAddress, PaymentMethod, WorkEventKind } from "./types"
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

  // MERGE-STUB: replaced by the backend branch (accounts.interests, work_stats_daily).
  async setInterests(_categories: CategoryId[]): Promise<Result> {
    return { error: "Chưa lưu được sở thích." }
  },
  async logWorkEvents(_events: { work: string; kind: WorkEventKind }[]): Promise<Result> {
    return done
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

"use client"

import * as React from "react"
import { MapPin, Plus } from "lucide-react"
import { Button, Field, inputClass } from "@/components/ui"
import { actions } from "@/lib/client-actions"
import { CITIES, districtsOf } from "@/lib/geo"
import { useApp, useRefresh } from "@/lib/store"
import type { AddressItem } from "@/lib/api/types"
import { cn } from "@/lib/utils"

/**
 * Where the freelancer is going. The address is saved before a booking is made,
 * because travel distance and the travel fee are computed from its coordinates --
 * a typed-in line the server has never seen cannot be priced.
 *
 * `value` is the resolved selection: callers keep their own state at null and pass
 * `defaultAddressId(addresses)` as the fallback, so the default address is already
 * chosen on the first render with no effect writing back into the parent.
 */
export function AddressPicker({
  value,
  onChange,
  city,
  district,
}: {
  value: string | null
  onChange: (id: string | null) => void
  /** Where the freelancer is based, used as the starting point of a new address. */
  city: string
  district: string
}) {
  const { addresses } = useApp()
  const refresh = useRefresh()
  const [adding, setAdding] = React.useState(addresses.length === 0)

  return (
    <div>
      {addresses.length > 0 && (
        <ul className="space-y-2">
          {addresses.map((address) => (
            <li key={address.id}>
              <button
                type="button"
                aria-pressed={value === address.id}
                onClick={() => {
                  onChange(address.id)
                  setAdding(false)
                }}
                className={cn(
                  "flex w-full gap-2.5 rounded-xl border p-3 text-left",
                  value === address.id && !adding ? "border-rose bg-blush" : "border-line bg-surface",
                )}
              >
                <MapPin className={cn("mt-0.5 size-4 shrink-0", value === address.id ? "text-rose" : "text-muted")} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{address.label}</span>
                  <span className="block truncate text-xs text-muted">
                    {[address.detail, address.district, address.city].filter(Boolean).join(", ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <NewAddressForm
          city={city}
          district={district}
          onCancel={addresses.length ? () => setAdding(false) : undefined}
          onSaved={(id) => {
            onChange(id)
            setAdding(false)
            refresh()
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-rose"
        >
          <Plus className="size-4" /> Thêm địa chỉ khác
        </button>
      )}
    </div>
  )
}

function NewAddressForm({
  city: initialCity,
  district: initialDistrict,
  onSaved,
  onCancel,
}: {
  city: string
  district: string
  onSaved: (id: string) => void
  onCancel?: () => void
}) {
  const [label, setLabel] = React.useState("Nhà")
  const [city, setCity] = React.useState(initialCity)
  const [district, setDistrict] = React.useState(initialDistrict)
  const [detail, setDetail] = React.useState("")
  const [note, setNote] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const valid = detail.trim().length >= 3

  return (
    <div className="mt-2 rounded-xl border border-line bg-surface p-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Tên địa chỉ">
          <input className={cn(inputClass, "text-sm")} value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label="Tỉnh/thành">
          <select
            className={cn(inputClass, "text-sm")}
            value={city}
            onChange={(e) => {
              setCity(e.target.value)
              setDistrict(districtsOf(e.target.value)[0])
            }}
          >
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-2">
        <Field label="Quận/huyện">
          <select className={cn(inputClass, "text-sm")} value={district} onChange={(e) => setDistrict(e.target.value)}>
            {districtsOf(city).map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-2">
        <Field label="Số nhà, đường">
          <input
            className={cn(inputClass, "text-sm")}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Số nhà, ngõ, đường, toà nhà"
          />
        </Field>
      </div>
      <div className="mt-2">
        <Field label="Ghi chú tìm đường" hint="Tầng, số căn hộ, mã cổng, chỗ gửi xe.">
          <input className={cn(inputClass, "text-sm")} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          disabled={busy || !valid}
          onClick={async () => {
            setBusy(true)
            setError(null)
            const result = await actions.saveAddress({
              label: label.trim() || "Nhà",
              city,
              district,
              detail: detail.trim(),
              note: note.trim(),
              isDefault: true,
            })
            setBusy(false)
            if ("error" in result) return setError(result.error)
            onSaved(result.id)
          }}
        >
          {busy ? "Đang lưu…" : "Lưu địa chỉ"}
        </Button>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Huỷ
          </Button>
        )}
      </div>
    </div>
  )
}

export const addressLine = (a: AddressItem) => [a.detail, a.district, a.city].filter(Boolean).join(", ")

/** The address a form should start on: the default one, else the first saved one. */
export function defaultAddressId(addresses: AddressItem[]): string | null {
  return addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null
}

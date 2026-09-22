"use client"

import * as React from "react"
import { MapPin, Trash2 } from "lucide-react"
import { AddressPicker } from "@/components/address-picker"
import { RequireSession } from "@/components/require-session"
import { Card, EmptyState, PageHeader } from "@/components/ui"
import { actions, useAct } from "@/lib/client-actions"
import { useApp } from "@/lib/store"

export default function AddressesPage() {
  return (
    <div className="mx-auto max-w-2xl md:pt-4">
      <PageHeader title="Địa chỉ của tôi" back="/me" />
      <RequireSession role="customer">
        <Addresses />
      </RequireSession>
    </div>
  )
}

function Addresses() {
  const { addresses } = useApp()
  const act = useAct()
  const [error, setError] = React.useState<string | null>(null)

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        Chuyên viên đi tới đây, và khoảng cách quyết định phí di chuyển. Địa chỉ chỉ bạn và chuyên viên đã nhận job của
        bạn nhìn thấy.
      </p>

      {addresses.length === 0 && (
        <EmptyState
          icon={<MapPin className="size-6" />}
          title="Chưa có địa chỉ nào"
          text="Thêm địa chỉ để đặt lịch làm tại nhà."
        />
      )}

      {addresses.map((address) => (
        <Card key={address.id} className="flex items-start gap-3 p-4">
          <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {address.label}
              {address.isDefault && <span className="ml-2 text-[11px] font-normal text-muted">Mặc định</span>}
            </p>
            <p className="text-xs text-muted">
              {[address.detail, address.district, address.city].filter(Boolean).join(", ")}
            </p>
            {address.note && <p className="mt-0.5 text-xs text-muted">{address.note}</p>}
          </div>
          <button
            type="button"
            aria-label={`Xoá địa chỉ ${address.label}`}
            onClick={async () => {
              const problem = await act(() => actions.deleteAddress(address.id), "Đã xoá địa chỉ")
              setError(problem)
            }}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </Card>
      ))}

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <div>
        <h2 className="mb-2 font-semibold">Thêm địa chỉ</h2>
        <AddressPicker value={null} onChange={() => {}} city="Hà Nội" district="Đống Đa" />
      </div>
    </div>
  )
}

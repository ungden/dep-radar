import { ButtonLink, EmptyState } from "@/components/ui"

export default function NotFound() {
  return (
    <EmptyState
      title="Không tìm thấy trang"
      text="Trang bạn tìm có thể đã bị xóa hoặc đổi địa chỉ."
      action={<ButtonLink href="/">Về trang khám phá</ButtonLink>}
    />
  )
}

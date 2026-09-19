import Link from "next/link"
import { Logo } from "@/components/ui"
import { CATEGORIES } from "@/lib/catalog"
import { CITIES } from "@/lib/geo"
import { POLICY } from "@/lib/pricing"

/**
 * Desktop footer. It exists for two reasons: a wide screen without one looks
 * unfinished, and these are the links search engines follow to the city and
 * category pages people actually search for.
 */

const citySlug = (city: string) =>
  city
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

export function Footer() {
  return (
    <footer className="mt-16 hidden border-t border-line bg-surface md:block">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-soft">
              Đặt lịch làm đẹp với chuyên viên freelancer đến tận nhà. Giá theo khung chuẩn, khách không trả phí nền
              tảng, miễn phí di chuyển trong {POLICY.freeTravelKm} km đầu.
            </p>
          </div>

          <nav>
            <h2 className="text-sm font-semibold">Dịch vụ</h2>
            <ul className="mt-3 space-y-1.5 text-[13px] text-ink-soft">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <Link href={`/search?category=${c.id}`} className="hover:text-ink">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <h2 className="text-sm font-semibold">Khu vực</h2>
            <ul className="mt-3 space-y-1.5 text-[13px] text-ink-soft">
              {CITIES.map((city) => (
                <li key={city}>
                  <Link href={`/${citySlug(city)}/nail`} className="hover:text-ink">
                    Nail tại nhà {city}
                  </Link>
                </li>
              ))}
              {CITIES.map((city) => (
                <li key={`${city}-makeup`}>
                  <Link href={`/${citySlug(city)}/makeup`} className="hover:text-ink">
                    Makeup tại nhà {city}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <h2 className="text-sm font-semibold">dep360</h2>
            <ul className="mt-3 space-y-1.5 text-[13px] text-ink-soft">
              <li>
                <Link href="/tro-giup" className="hover:text-ink">
                  Trợ giúp & an toàn
                </Link>
              </li>
              <li>
                <Link href="/chinh-sach" className="hover:text-ink">
                  Chính sách phí & đặt lịch
                </Link>
              </li>
              <li>
                <Link href="/login?role=pro" className="hover:text-ink">
                  Trở thành chuyên viên
                </Link>
              </li>
              <li>
                <Link href="/pros" className="hover:text-ink">
                  Tất cả chuyên viên
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <p className="mt-8 border-t border-line pt-5 text-xs text-muted">
          Bản demo: chuyên viên và tác phẩm hiện là dữ liệu mẫu, thanh toán online chưa hoạt động.
        </p>
      </div>
    </footer>
  )
}

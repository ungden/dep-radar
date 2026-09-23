import Link from "next/link"
import { Logo } from "@/components/ui"
import { CATEGORIES, VERTICALS } from "@/lib/catalog"
import { OCCASIONS } from "@/lib/occasions"
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
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-soft">
              Đặt thợ làm đẹp, người chụp ảnh và người mẫu gần bạn. Giá theo khung chuẩn, khách không trả phí nền
              tảng, miễn phí di chuyển trong {POLICY.freeTravelKm} km đầu.
            </p>
          </div>

          <nav>
            {VERTICALS.map((v) => (
              <div key={v.id} className="mb-5 last:mb-0">
                <h2 className="text-sm font-bold">{v.label}</h2>
                <ul className="mt-2 space-y-1.5 text-[13px] text-ink-soft">
                  {CATEGORIES.filter((c) => c.vertical === v.id).map((c) => (
                    <li key={c.id}>
                      <Link href={`/search?category=${c.id}`} className="hover:text-ink">
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <nav>
            <h2 className="text-sm font-bold">Theo dịp</h2>
            <ul className="mb-5 mt-2 space-y-1.5 text-[13px] text-ink-soft">
              {OCCASIONS.map((o) => (
                <li key={o.id}>
                  <Link href={`/dip/${o.id}`} className="hover:text-ink">
                    {o.title}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="text-sm font-bold">Khu vực</h2>
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
            <h2 className="text-sm font-bold">360dep</h2>
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
                <Link href="/gioi-thieu" className="hover:text-ink">
                  Giới thiệu bạn bè
                </Link>
              </li>
              <li>
                <Link href="/login?role=pro" className="hover:text-ink">
                  Nhận khách trên 360dep
                </Link>
              </li>
              <li>
                <Link href="/pros" className="hover:text-ink">
                  Tất cả người làm
                </Link>
              </li>
              <li>
                <Link href="/tuyen-mau" className="hover:text-ink">
                  Tuyển mẫu
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <p className="mt-8 border-t border-line pt-5 text-xs text-muted">
          Bản demo: nhiều hồ sơ người làm và tác phẩm là dữ liệu mẫu, thanh toán online chưa hoạt động.
        </p>
      </div>
    </footer>
  )
}

import Link from "next/link"
import { LogoMark, Wordmark } from "@/components/ui"
import { CATEGORIES, VERTICALS } from "@/lib/catalog"
import { OCCASIONS } from "@/lib/occasions"
import { CITIES } from "@/lib/geo"
import { TRAVEL_FEE_SUMMARY } from "@/lib/pricing"
import { DEMO_DATA_LIVE } from "@/lib/launch"
import { CompanyInfo } from "@/components/company-info"
import { CONDUCT } from "@/lib/conduct"

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
    <footer className="mt-20 hidden bg-ink text-white/70 md:block">
      <div className="mx-auto max-w-[1200px] px-6 pb-10 pt-14">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2.5">
              <LogoMark size={36} />
              <Wordmark size={28} tone="gold" />
            </span>
            <p className="mt-4 max-w-xs text-meta leading-relaxed text-white/70">
              Đặt thợ làm đẹp, người chụp ảnh và người mẫu gần bạn. Giá theo khung chuẩn, khách không trả phí nền
              tảng. Phí di chuyển tại nhà: {TRAVEL_FEE_SUMMARY}.
            </p>
          </div>

          <nav>
            {VERTICALS.map((v) => (
              <div key={v.id} className="mb-5 last:mb-0">
                <h2 className="text-meta font-bold uppercase tracking-[0.08em] text-white">{v.label}</h2>
                <ul className="mt-2 space-y-1.5 text-meta text-white/65">
                  {CATEGORIES.filter((c) => c.vertical === v.id).map((c) => (
                    <li key={c.id}>
                      <Link href={`/search?category=${c.id}`} className="hover:text-white">
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <nav>
            <h2 className="text-meta font-bold uppercase tracking-[0.08em] text-white">Theo dịp</h2>
            <ul className="mb-5 mt-2 space-y-1.5 text-meta text-white/65">
              {OCCASIONS.map((o) => (
                <li key={o.id}>
                  <Link href={`/dip/${o.id}`} className="hover:text-white">
                    {o.title}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="text-meta font-bold uppercase tracking-[0.08em] text-white">Khu vực</h2>
            <ul className="mt-3 space-y-1.5 text-meta text-white/65">
              {CITIES.map((city) => (
                <li key={city}>
                  <Link href={`/${citySlug(city)}/nail`} className="hover:text-white">
                    Nail tại nhà {city}
                  </Link>
                </li>
              ))}
              {CITIES.map((city) => (
                <li key={`${city}-makeup`}>
                  <Link href={`/${citySlug(city)}/makeup`} className="hover:text-white">
                    Makeup tại nhà {city}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <h2 className="text-meta font-bold uppercase tracking-[0.08em] text-white">360dep</h2>
            <ul className="mt-3 space-y-1.5 text-meta text-white/65">
              <li>
                <Link href="/tro-giup" className="hover:text-white">
                  Trợ giúp & an toàn
                </Link>
              </li>
              <li>
                <Link href="/chinh-sach" className="hover:text-white">
                  Chính sách phí & đặt lịch
                </Link>
              </li>
              <li>
                <Link href="/quy-che" className="hover:text-white">
                  Quy chế hoạt động
                </Link>
              </li>
              <li>
                <Link href="/gioi-thieu" className="hover:text-white">
                  Giới thiệu bạn bè
                </Link>
              </li>
              <li>
                <Link href="/doi-tac" className="hover:text-white">
                  Dành cho đối tác
                </Link>
              </li>
              <li>
                <Link href="/mcn" className="hover:text-white">
                  Hợp tác network MCN
                </Link>
              </li>
              <li>
                <Link href="/pros" className="hover:text-white">
                  Tất cả người làm
                </Link>
              </li>
              <li>
                <Link href="/tuyen-mau" className="hover:text-white">
                  Tuyển mẫu
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 space-y-1 border-t border-white/10 pt-6 text-label text-white/55">
          <p className="font-semibold text-white/80">{CONDUCT.footer}</p>
          <CompanyInfo />
          {DEMO_DATA_LIVE && <p>Bản demo: nhiều hồ sơ người làm và tác phẩm là dữ liệu mẫu, thanh toán online chưa hoạt động.</p>}
        </div>
      </div>
    </footer>
  )
}

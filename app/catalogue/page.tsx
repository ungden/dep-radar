import Link from "next/link"
import { ArrowRight, Filter, Search, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { catalogueSections, secondaryFilterGroups, topCatalogueNavigation } from "@/lib/catalogue"
import { getCatalogueGuide } from "@/lib/catalogue-guide"

export const metadata = {
  title: "Catalogue nhu cầu làm đẹp | 360° đẹp",
  description: "Bản đồ catalogue Đẹp Radar theo nhu cầu: da mặt, trị mụn, sáng da, chống nắng, tóc, bodycare, makeup, nam giới, clinic và ingredient radar.",
}

export default function CataloguePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 md:py-14">
      <div className="container mx-auto px-4 md:px-6">
        <section className="mb-10 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-10">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">
              <Sparkles className="h-3.5 w-3.5" />
              Catalogue theo nhu cầu
            </div>
            <h1 className="font-display text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl">
              Đẹp Radar ưu tiên nhu cầu làm đẹp trước, giới tính chỉ là filter.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
              Người dùng thường tìm theo vấn đề thật: trị mụn, kem chống nắng da dầu,
              rụng tóc, nám sau sinh, makeup đi tiệc, body sáng da. Catalogue này biến
              các intent đó thành lối vào chính, sau đó mới lọc theo nam/nữ, tuổi,
              loại da và ngân sách.
            </p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <Search className="mb-3 h-5 w-5 text-rose-500" />
              <div className="font-bold text-slate-900 dark:text-slate-50">Tìm theo nhu cầu</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Bắt đầu từ trị mụn, chống nắng, tóc, bodycare, makeup hoặc treatment.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <Filter className="mb-3 h-5 w-5 text-rose-500" />
              <div className="font-bold text-slate-900 dark:text-slate-50">Lọc đúng tình trạng</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Thu hẹp theo loại da, ngân sách, đối tượng dùng và mức độ nhạy cảm.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <Sparkles className="mb-3 h-5 w-5 text-rose-500" />
              <div className="font-bold text-slate-900 dark:text-slate-50">Khám phá rộng hơn</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Có ingredient, clinic, tools, fragrance và dịch vụ làm đẹp để tra cứu tiếp.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
                Lối vào nổi bật
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Các nhu cầu phổ biến được đặt sẵn để bạn vào nhanh hơn.
              </p>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {topCatalogueNavigation.map((section) => (
              <Link
                key={section.slug}
                href={`/catalogue/${section.slug}`}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-rose-200 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-900 dark:hover:text-rose-300"
              >
                {section.shortTitle}
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {catalogueSections.map((section) => (
            <CatalogueCard key={section.slug} section={section} />
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
            Lọc thêm sau khi chọn nhu cầu
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <FilterBlock title="Đối tượng" items={secondaryFilterGroups.audience} />
            <FilterBlock title="Loại da" items={secondaryFilterGroups.skinType} />
            <FilterBlock title="Ngân sách" items={secondaryFilterGroups.budget} />
          </div>
        </section>
      </div>
    </div>
  )
}

function CatalogueCard({ section }: { section: (typeof catalogueSections)[number] }) {
  const guide = getCatalogueGuide(section.slug)

  return (
    <Link href={`/catalogue/${section.slug}`} className="group">
      <Card className="h-full border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-900">
        <CardContent className="flex h-full flex-col p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              {guide && (
                <Badge variant="secondary" className="mb-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                  {guide.updated}
                </Badge>
              )}
              <h3 className="font-display text-xl font-bold text-slate-900 transition-colors group-hover:text-rose-600 dark:text-slate-50 dark:group-hover:text-rose-300">
                {section.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {guide?.snapshot ?? section.description}
              </p>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-rose-500" />
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex flex-wrap gap-2">
              {section.branches.slice(0, 4).map((branch) => (
                <Badge key={branch.title} variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {branch.title}
                </Badge>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-4 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Lọc theo: {section.filters.slice(0, 3).join(" / ")}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function FilterBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="outline" className="border-slate-200 px-3 py-1 text-slate-600 dark:border-slate-700 dark:text-slate-300">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  )
}

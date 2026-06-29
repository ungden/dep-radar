"use client"

import * as React from "react"
import Link from "next/link"
import { Search, Filter, ShieldCheck } from "lucide-react"
import { motion } from "motion/react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlatformBadge } from "@/components/platform-badge"
import { getKols } from "@/lib/data"
import { containerVariants, itemVariants } from "@/lib/animations"
import type { Kol } from "@/lib/types"

export default function KocTrackerPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedPlatform, setSelectedPlatform] = React.useState<string | null>(null)
  const [kols, setKols] = React.useState<Kol[]>([])

  React.useEffect(() => {
    getKols().then(setKols)
  }, [])

  const kolPlatforms = React.useCallback(
    (kol: Kol) => (kol.socials?.length ? kol.socials.map(s => s.platform) : [kol.platform]),
    []
  )

  const platforms = React.useMemo(
    () => Array.from(new Set(kols.flatMap(kolPlatforms))),
    [kols, kolPlatforms]
  )

  const filteredKols = React.useMemo(() =>
    kols.filter(kol => {
      const query = searchQuery.toLowerCase()
      const matchesSearch = kol.name.toLowerCase().includes(query) ||
                            kol.handle.toLowerCase().includes(query) ||
                            (kol.socials?.some(s => s.handle.toLowerCase().includes(query)) ?? false)
      const matchesPlatform = selectedPlatform ? kolPlatforms(kol).includes(selectedPlatform) : true
      return matchesSearch && matchesPlatform
    }),
    [kols, searchQuery, selectedPlatform, kolPlatforms]
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-slate-50 mb-4">
            KOL/KOC Tracker
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
            Khám phá và theo dõi các Beauty Blogger, KOC hàng đầu. Đánh giá độ uy tín, xem lịch sử review và phát hiện các bài đăng tài trợ (PR) một cách minh bạch.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              type="search"
              placeholder="Tìm kiếm KOL/KOC..."
              className="w-full pl-10 bg-slate-50 dark:bg-slate-950 border-transparent focus-visible:ring-rose-500 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Button
              variant={selectedPlatform === null ? "default" : "outline"}
              className={`rounded-xl whitespace-nowrap ${selectedPlatform === null ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
              onClick={() => setSelectedPlatform(null)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Tất cả nền tảng
            </Button>
            {platforms.map(platform => (
              <Button
                key={platform}
                variant={selectedPlatform === platform ? "default" : "outline"}
                className={`rounded-xl whitespace-nowrap ${selectedPlatform === platform ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
                onClick={() => setSelectedPlatform(platform)}
              >
                {platform}
              </Button>
            ))}
          </div>
        </motion.div>

        {filteredKols.length > 0 ? (
          <motion.div
            key={filteredKols.length}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredKols.map((kol) => (
              <motion.div key={kol.id} variants={itemVariants}>
                <Link href={`/koc-tracker/${kol.id}`}>
                  <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 group bg-white dark:bg-slate-900 rounded-2xl h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-6">
                        <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-900 shadow-md ring-2 ring-slate-50 dark:ring-slate-800 group-hover:ring-rose-100 dark:group-hover:ring-rose-900/30 transition-all">
                          <AvatarImage src={kol.avatar} alt={kol.name} />
                          <AvatarFallback>{kol.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-50 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
                              {kol.name}
                            </h3>
                            {kol.verified && <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0" />}
                          </div>
                          <div className="mb-3 flex flex-wrap gap-1.5">
                            {Array.from(new Set(kol.socials?.length ? kol.socials.map(s => s.platform) : [kol.platform])).map((p) => (
                              <PlatformBadge key={p} platform={p} />
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex flex-col">
                              <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Followers</span>
                              <span className="font-bold text-slate-900 dark:text-slate-50">{kol.followers}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
                            <div className="flex flex-col">
                              <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Độ uy tín</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{kol.trustscore}/100</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {kol.bio && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                            {kol.bio}
                          </p>
                        )}
                        <div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Chuyên mục</div>
                          <div className="flex flex-wrap gap-2">
                            {kol.categories?.map((cat: string) => (
                              <Badge key={cat} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Review gần nhất</div>
                          <div className="font-medium text-slate-900 dark:text-slate-50 text-sm truncate">{kol.recentreview}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-slate-500 dark:text-slate-400 text-lg">Không tìm thấy KOL/KOC nào phù hợp.</p>
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => { setSearchQuery(""); setSelectedPlatform(null) }}
            >
              Xóa bộ lọc
            </Button>
          </motion.div>
        )}

        {filteredKols.length > 0 && (
          <motion.div
            className="mt-12 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button variant="outline" className="rounded-full px-8 h-12 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-900">
              Xem thêm KOL/KOC
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowDownUp, Filter, Search, ShieldCheck, Sparkles, UsersRound } from "lucide-react"
import { motion } from "motion/react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlatformBadge } from "@/components/platform-badge"
import { parseFollowers } from "@/lib/kols-data"
import { credibilityToneClass, getKolCredibility } from "@/lib/kol-credibility"
import { containerVariants, itemVariants } from "@/lib/animations"
import type { Kol } from "@/lib/types"

type SortMode = "influence" | "credibility" | "balanced" | "name"
type CredibilityFilter = "all" | "expert" | "trusted" | "commercial"
type ReachFilter = "all" | "mega" | "macro" | "mid" | "micro"
type VerificationFilter = "all" | "verified" | "unverified"

const INITIAL_VISIBLE_COUNT = 24

export function CreatorDirectory({ initialKols, initialFilters = {} }: { initialKols: Kol[]; initialFilters?: Record<string, string> }) {
  const [searchQuery, setSearchQuery] = React.useState(initialFilters.q ?? "")
  const [selectedPlatform, setSelectedPlatform] = React.useState<string | null>(initialFilters.platform ?? null)
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(initialFilters.category ?? null)
  const [credibilityFilter, setCredibilityFilter] = React.useState<CredibilityFilter>((initialFilters.credibility as CredibilityFilter) ?? "all")
  const [reachFilter, setReachFilter] = React.useState<ReachFilter>((initialFilters.reach as ReachFilter) ?? "all")
  const [verificationFilter, setVerificationFilter] = React.useState<VerificationFilter>((initialFilters.verification as VerificationFilter) ?? "all")
  const [sortMode, setSortMode] = React.useState<SortMode>((initialFilters.sort as SortMode) ?? "influence")
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_VISIBLE_COUNT)
  const kols = initialKols

  React.useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (selectedPlatform) params.set("platform", selectedPlatform)
    if (selectedCategory) params.set("category", selectedCategory)
    if (credibilityFilter !== "all") params.set("credibility", credibilityFilter)
    if (reachFilter !== "all") params.set("reach", reachFilter)
    if (verificationFilter !== "all") params.set("verification", verificationFilter)
    if (sortMode !== "influence") params.set("sort", sortMode)
    const query = params.toString()
    window.history.replaceState(null, "", query ? `/koc-tracker?${query}` : "/koc-tracker")
  }, [searchQuery, selectedPlatform, selectedCategory, credibilityFilter, reachFilter, verificationFilter, sortMode])

  const kolPlatforms = React.useCallback(
    (kol: Kol) => (kol.socials?.length ? kol.socials.map(s => s.platform) : [kol.platform]),
    []
  )

  const platforms = React.useMemo(
    () => Array.from(new Set(kols.flatMap(kolPlatforms))),
    [kols, kolPlatforms]
  )

  const categories = React.useMemo(
    () => Array.from(new Set(kols.flatMap((kol) => kol.categories ?? []))).sort((a, b) => a.localeCompare(b)),
    [kols]
  )

  const rankedKols = React.useMemo(
    () => kols
      .map((kol) => ({
        kol,
        credibility: getKolCredibility(kol),
        reach: getTotalReach(kol),
      }))
      .sort((a, b) => sortRankedKols(a, b, "influence")),
    [kols]
  )

  const totalReach = React.useMemo(() => rankedKols.reduce((sum, item) => sum + item.reach, 0), [rankedKols])

  const filteredKols = React.useMemo(() =>
    kols.map((kol) => ({
      kol,
      credibility: getKolCredibility(kol),
      reach: getTotalReach(kol),
    })).filter(({ kol, credibility, reach }) => {
      const query = searchQuery.toLowerCase()
      const matchesSearch = !query ||
                            kol.name.toLowerCase().includes(query) ||
                            kol.handle.toLowerCase().includes(query) ||
                            (kol.realName?.toLowerCase().includes(query) ?? false) ||
                            (kol.socials?.some(s => s.handle.toLowerCase().includes(query)) ?? false) ||
                            kol.categories?.some((category) => category.toLowerCase().includes(query)) ||
                            kol.specialties?.some((specialty) => specialty.toLowerCase().includes(query))
      const matchesPlatform = selectedPlatform ? kolPlatforms(kol).includes(selectedPlatform) : true
      const matchesCategory = selectedCategory ? kol.categories?.includes(selectedCategory) : true
      const matchesReach = reachMatchesFilter(reach, reachFilter)
      const matchesVerification = verificationFilter === "all"
        ? true
        : verificationFilter === "verified"
          ? kol.verified
          : !kol.verified
      const matchesCredibility = credibilityFilter === "all"
        ? true
        : credibilityFilter === "expert"
          ? credibility.tier === "expert"
          : credibilityFilter === "trusted"
            ? ["expert", "trusted_reviewer", "cross_check"].includes(credibility.tier)
            : credibility.tier === "commercial_koc"
      return matchesSearch && matchesPlatform && matchesCategory && matchesReach && matchesVerification && matchesCredibility
    }).sort((a, b) => sortRankedKols(a, b, sortMode)),
    [kols, searchQuery, selectedPlatform, selectedCategory, credibilityFilter, reachFilter, verificationFilter, sortMode, kolPlatforms]
  )

  React.useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT)
  }, [searchQuery, selectedPlatform, selectedCategory, credibilityFilter, reachFilter, verificationFilter, sortMode])

  const visibleKols = filteredKols.slice(0, visibleCount)
  const hasMoreKols = visibleKols.length < filteredKols.length
  const hasActiveFilters = Boolean(searchQuery || selectedPlatform || selectedCategory || credibilityFilter !== "all" || reachFilter !== "all" || verificationFilter !== "all" || sortMode !== "influence")

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
            Danh bạ creator beauty
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
            Tra cứu kênh, phạm vi nội dung và mức độ đầy đủ hồ sơ. “Xác minh” ở đây chỉ nói về danh tính/kênh public, không phải bảo chứng cho mọi claim hay sản phẩm.
          </p>
        </motion.div>

        <motion.div
          className="mb-6 grid gap-3 sm:grid-cols-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          <MetricCard icon={UsersRound} label="Hồ sơ public" value={kols.length || "..."} />
          <MetricCard icon={Sparkles} label="Tổng reach snapshot" value={kols.length ? formatReach(totalReach) : "..."} />
          <MetricCard icon={ShieldCheck} label="Kênh đã đối chiếu" value={kols.filter((kol) => kol.verified).length} />
        </motion.div>

        <motion.div
          className="mb-8 space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.2fr)_190px_190px_190px_170px_160px]">
            <div className="relative w-full md:col-span-2 xl:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                type="search"
                placeholder="Tìm tên, handle, chuyên mục, chuyên môn..."
                className="w-full pl-10 bg-slate-50 dark:bg-slate-950 border-transparent focus-visible:ring-rose-500 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <FilterSelect
              icon={ArrowDownUp}
              label="Xếp hạng"
              value={sortMode}
              onChange={(value) => setSortMode(value as SortMode)}
            >
              <option value="influence">Sức ảnh hưởng</option>
              <option value="balanced">Độ phủ + hồ sơ</option>
              <option value="credibility">Mức đầy đủ hồ sơ</option>
              <option value="name">Tên A-Z</option>
            </FilterSelect>
            <FilterSelect
              icon={Filter}
              label="Chuyên mục"
              value={selectedCategory ?? "all"}
              onChange={(value) => setSelectedCategory(value === "all" ? null : value)}
            >
              <option value="all">Tất cả chuyên mục</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </FilterSelect>
            <FilterSelect
              icon={ShieldCheck}
              label="Loại hồ sơ"
              value={credibilityFilter}
              onChange={(value) => setCredibilityFilter(value as CredibilityFilter)}
            >
              <option value="all">Tất cả loại hồ sơ</option>
              <option value="expert">Rất đáng tin/chuyên gia</option>
              <option value="trusted">Có thể tham khảo</option>
              <option value="commercial">KOC thương mại</option>
            </FilterSelect>
            <FilterSelect
              icon={UsersRound}
              label="Quy mô"
              value={reachFilter}
              onChange={(value) => setReachFilter(value as ReachFilter)}
            >
              <option value="all">Mọi quy mô</option>
              <option value="mega">Mega · 1M+</option>
              <option value="macro">Macro · 300K-1M</option>
              <option value="mid">Mid · 100K-300K</option>
              <option value="micro">Micro · dưới 100K</option>
            </FilterSelect>
            <FilterSelect
              icon={Sparkles}
              label="Xác minh"
              value={verificationFilter}
              onChange={(value) => setVerificationFilter(value as VerificationFilter)}
            >
              <option value="all">Tất cả</option>
              <option value="verified">Kênh đã đối chiếu</option>
              <option value="unverified">Kênh chưa đối chiếu</option>
            </FilterSelect>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Mặc định: <span className="font-bold text-slate-900 dark:text-slate-50">Sức ảnh hưởng</span> · {filteredKols.length} hồ sơ phù hợp
            </div>
            <div className="flex gap-2 w-full overflow-x-auto pb-2 lg:w-auto lg:pb-0">
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
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  className="rounded-xl whitespace-nowrap text-slate-500"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedPlatform(null)
                    setSelectedCategory(null)
                    setCredibilityFilter("all")
                    setReachFilter("all")
                    setVerificationFilter("all")
                    setSortMode("influence")
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
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
            {visibleKols.map(({ kol, credibility, reach }, index) => {
              return (
                <motion.div key={kol.id} variants={itemVariants}>
                  <Link href={`/koc-tracker/${kol.id}`}>
                    <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 group bg-white dark:bg-slate-900 rounded-2xl h-full">
                      <CardContent className="p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <Badge className="rounded-full border-none bg-slate-900 text-white hover:bg-slate-900 dark:bg-slate-50 dark:text-slate-900">
                            #{index + 1}
                          </Badge>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {sortModeLabel(sortMode)}
                          </span>
                        </div>
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
                              {kol.verified && <ShieldCheck aria-label="Kênh public đã được đối chiếu" className="h-5 w-5 text-blue-500 shrink-0" />}
                            </div>
                            <Badge variant="outline" className={`mb-3 rounded-full border ${credibilityToneClass(credibility.tier)}`}>
                              {credibility.shortLabel}
                            </Badge>
                            <div className="mb-3 flex flex-wrap gap-1.5">
                              {Array.from(new Set(kol.socials?.length ? kol.socials.map(s => s.platform) : [kol.platform])).map((p) => (
                                <PlatformBadge key={p} platform={p} />
                              ))}
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div className="flex flex-col">
                                <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Reach</span>
                                <span className="font-bold text-slate-900 dark:text-slate-50">{formatReach(reach)}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Tin cậy</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{credibility.credibilityScore}/100</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Độ phủ</span>
                                <span className="font-bold text-slate-900 dark:text-slate-50">{credibility.influenceScore}/100</span>
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
              )
            })}
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
              onClick={() => {
                setSearchQuery("")
                setSelectedPlatform(null)
                setSelectedCategory(null)
                setCredibilityFilter("all")
                setReachFilter("all")
                setVerificationFilter("all")
                setSortMode("influence")
              }}
            >
              Xóa bộ lọc
            </Button>
          </motion.div>
        )}

        {hasMoreKols && (
          <motion.div
            className="mt-12 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              variant="outline"
              className="rounded-full px-8 h-12 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-900"
              onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE_COUNT)}
            >
              Xem thêm {Math.min(INITIAL_VISIBLE_COUNT, filteredKols.length - visibleKols.length)} hồ sơ
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

type RankedKol = {
  kol: Kol
  credibility: ReturnType<typeof getKolCredibility>
  reach: number
}

function getTotalReach(kol: Kol) {
  const socials = kol.socials?.length ? kol.socials : [{ platform: kol.platform, handle: kol.handle, followers: kol.followers }]
  const socialReach = socials.reduce((sum, social) => sum + parseFollowers(social.followers), 0)
  return Math.max(socialReach, parseFollowers(kol.followers))
}

function influenceScore(item: RankedKol) {
  const reachScore = Math.min(100, Math.round(Math.log10(Math.max(item.reach, 1)) * 15))
  const platformScore = Math.min(15, (item.kol.socials?.length ?? 1) * 3)
  const verifiedScore = item.kol.verified ? 8 : 0
  return reachScore + platformScore + verifiedScore + item.credibility.influenceScore * 0.35
}

function sortRankedKols(a: RankedKol, b: RankedKol, mode: SortMode) {
  if (mode === "name") return a.kol.name.localeCompare(b.kol.name, "vi")
  if (mode === "credibility") {
    return b.credibility.credibilityScore - a.credibility.credibilityScore || influenceScore(b) - influenceScore(a)
  }
  if (mode === "balanced") {
    const aScore = influenceScore(a) * 0.55 + a.credibility.credibilityScore * 0.45
    const bScore = influenceScore(b) * 0.55 + b.credibility.credibilityScore * 0.45
    return bScore - aScore || b.reach - a.reach
  }
  return influenceScore(b) - influenceScore(a) || b.reach - a.reach || b.credibility.credibilityScore - a.credibility.credibilityScore
}

function reachMatchesFilter(reach: number, filter: ReachFilter) {
  if (filter === "mega") return reach >= 1_000_000
  if (filter === "macro") return reach >= 300_000 && reach < 1_000_000
  if (filter === "mid") return reach >= 100_000 && reach < 300_000
  if (filter === "micro") return reach < 100_000
  return true
}

function formatReach(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

function sortModeLabel(mode: SortMode) {
  return {
    influence: "Sức ảnh hưởng",
    credibility: "Tin cậy",
    balanced: "Cân bằng",
    name: "A-Z",
  }[mode]
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <Card className="border-none bg-white shadow-sm dark:bg-slate-900">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-50">{value}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function FilterSelect({
  icon: Icon,
  label,
  value,
  onChange,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-transparent bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-rose-200 focus:ring-2 focus:ring-rose-100 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-rose-900 dark:focus:ring-rose-950"
      >
        {children}
      </select>
    </label>
  )
}

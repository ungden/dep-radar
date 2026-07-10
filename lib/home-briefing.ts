import { catalogueSections, topCatalogueNavigation, type CatalogueSection } from "@/lib/catalogue"
import { articleHref, buildDailyEditorialPlan, type DailyEditorialCandidate, type DailyEditorialPlan } from "@/lib/content-graph"
import type { CreatorProductEvent, Kol, Post, Product } from "@/lib/types"

export type HomeBriefingItemKind = "article" | "creator" | "product"

export interface HomeBriefingItem {
  kind: HomeBriefingItemKind
  title: string
  excerpt: string
  href: string
  date: string
  image?: string
  avatar?: string
  label: string
  sourceName: string
}

export interface HomeProductSignal {
  product: Product
  mentions: number
  latestDate: string
  creatorNames: string[]
  categoryLabel: string
}

export interface HomeCreatorUpdate {
  creator: Pick<Kol, "id" | "name" | "avatar" | "platform" | "verified">
  title: string
  excerpt: string
  date: string
  eventLabel: string
  href: string
  product?: Pick<Product, "id" | "name" | "brand" | "image" | "category">
  sourceName: string
  toneLabel: string
  disclosureLabel: string
}

export interface HomeDailyBriefing {
  leadStory: HomeBriefingItem | null
  dailyUpdates: HomeBriefingItem[]
  creatorUpdates: HomeCreatorUpdate[]
  productSignals: HomeProductSignal[]
  cataloguePrompts: CatalogueSection[]
  staleOrNeedsUpdate: Pick<Kol, "id" | "name" | "avatar" | "platform">[]
  editorialPlan: DailyEditorialPlan
}

type ProductSignalStats = {
  mentions: number
  latestDate: string
  creatorIds: Set<string>
}

function postHref(post: Post) {
  return articleHref(post)
}

function productHref(product: Product) {
  return `/products/${product.id}`
}

function creatorHref(creator: Pick<Kol, "id">) {
  return `/koc-tracker/${creator.id}`
}

function eventLabel(type: CreatorProductEvent["event_type"]) {
  const labels: Record<CreatorProductEvent["event_type"], string> = {
    first_seen: "Tin mới ghi nhận",
    mentioned: "Được nhắc tới",
    unboxed: "Mở hộp",
    used: "Đang dùng",
    reviewed: "Vừa review",
    recommended: "Có gợi ý",
    disliked: "Có điểm chê",
    emptied: "Dùng hết",
    repurchased: "Mua lại",
    switched_to: "Chuyển sang dùng",
    stopped_using: "Ngừng dùng",
    live_sold: "Có live bán",
    sponsored: "Nội dung tài trợ",
  }
  return labels[type]
}

function sentimentLabel(sentiment: CreatorProductEvent["sentiment"]) {
  return {
    positive: "Tín hiệu tích cực",
    mixed: "Có khen có chê",
    negative: "Không hợp",
    neutral: "Tin trung lập",
  }[sentiment]
}

function disclosureLabel(disclosure: CreatorProductEvent["disclosure"]) {
  return {
    organic: "Tự nhiên",
    pr: "Có PR",
    sponsored: "Tài trợ",
    affiliate: "Có affiliate",
    unknown: "Chưa rõ hợp tác",
  }[disclosure]
}

function recencyLabel(date: string) {
  const timestamp = new Date(date).getTime()
  if (!Number.isFinite(timestamp)) return "Đang cập nhật"

  const now = Date.now()
  const days = Math.floor((now - timestamp) / 86_400_000)
  if (days <= 1) return "Mới hôm nay"
  if (days <= 7) return "Trong 7 ngày qua"
  return "Đang được đọc lại"
}

function buildProductSignals(products: Product[], timelineEvents: CreatorProductEvent[], creatorMap: Map<string, Kol>) {
  const stats = new Map<string, ProductSignalStats>()

  for (const event of timelineEvents) {
    const current = stats.get(event.product_id) ?? {
      mentions: 0,
      latestDate: "",
      creatorIds: new Set<string>(),
    }
    current.mentions += 1
    current.latestDate = event.event_date > current.latestDate ? event.event_date : current.latestDate
    current.creatorIds.add(event.creator_id)
    stats.set(event.product_id, current)
  }

  return products
    .map((product): HomeProductSignal => {
      const productStats = stats.get(product.id) ?? { mentions: 0, latestDate: "", creatorIds: new Set<string>() }
      const creatorNames = [...productStats.creatorIds]
        .map((id) => creatorMap.get(id)?.name)
        .filter((name): name is string => Boolean(name))

      return {
        product,
        mentions: productStats.mentions,
        latestDate: productStats.latestDate,
        creatorNames,
        categoryLabel: product.category_key ? product.category : product.category,
      }
    })
    .sort((a, b) => (
      b.mentions - a.mentions ||
      b.latestDate.localeCompare(a.latestDate) ||
      b.product.rating - a.product.rating ||
      b.product.reviews - a.product.reviews
    ))
}

function buildCreatorUpdates(
  timelineEvents: CreatorProductEvent[],
  creatorMap: Map<string, Kol>,
  productMap: Map<string, Product>
) {
  return timelineEvents
    .filter((event) => creatorMap.has(event.creator_id))
    .sort((a, b) => b.event_date.localeCompare(a.event_date) || b.observed_at.localeCompare(a.observed_at))
    .map((event): HomeCreatorUpdate | null => {
      const creator = creatorMap.get(event.creator_id)
      if (!creator) return null
      const product = productMap.get(event.product_id)

      return {
        creator,
        title: event.source_title,
        excerpt: event.source_excerpt,
        date: event.event_date,
        eventLabel: eventLabel(event.event_type),
        href: creatorHref(creator),
        product,
        sourceName: event.source_platform,
        toneLabel: sentimentLabel(event.sentiment),
        disclosureLabel: disclosureLabel(event.disclosure),
      }
    })
    .filter((update): update is HomeCreatorUpdate => Boolean(update))
}

function buildDailyUpdates(
  posts: Post[],
  creatorUpdates: HomeCreatorUpdate[],
  productSignals: HomeProductSignal[],
  editorialCandidates: DailyEditorialCandidate[]
) {
  const scoredArticleItems: HomeBriefingItem[] = editorialCandidates.slice(0, 8).map((candidate) => ({
    kind: "article",
    title: candidate.post.title,
    excerpt: candidate.reason || candidate.post.excerpt,
    href: candidate.href,
    date: candidate.post.created_at,
    image: candidate.post.image,
    avatar: candidate.post.author_avatar,
    label: candidate.label,
    sourceName: candidate.post.author_name || "Beauty Desk",
  }))
  const articleItems = scoredArticleItems.length > 0
    ? scoredArticleItems
    : posts.slice(0, 8).map((post) => ({
        kind: "article" as const,
        title: post.title,
        excerpt: post.excerpt,
        href: postHref(post),
        date: post.created_at,
        image: post.image,
        avatar: post.author_avatar,
        label: post.category,
        sourceName: post.author_name || "Beauty Desk",
      }))

  const creatorItems: HomeBriefingItem[] = creatorUpdates.slice(0, 8).map((update) => ({
    kind: "creator",
    title: `${update.creator.name}: ${update.title}`,
    excerpt: update.excerpt,
    href: update.href,
    date: update.date,
    avatar: update.creator.avatar,
    label: update.eventLabel,
    sourceName: update.sourceName,
  }))

  const productItems: HomeBriefingItem[] = productSignals.slice(0, 5).map((signal) => ({
    kind: "product",
    title: signal.product.name,
    excerpt: signal.creatorNames.length
      ? `${signal.creatorNames.slice(0, 2).join(", ")} đang tạo tín hiệu cho sản phẩm này.`
      : "Sản phẩm vừa xuất hiện trong dòng tin beauty và sẽ được cập nhật thêm khi có nguồn mới.",
    href: productHref(signal.product),
    date: signal.latestDate,
    image: signal.product.image,
    label: `${signal.mentions || 1} lượt nhắc`,
    sourceName: signal.product.brand,
  }))

  const mixed: HomeBriefingItem[] = []
  const maxLength = Math.max(articleItems.length, creatorItems.length, productItems.length)

  for (let index = 0; index < maxLength; index += 1) {
    if (creatorItems[index]) mixed.push(creatorItems[index])
    if (articleItems[index]) mixed.push(articleItems[index])
    if (productItems[index]) mixed.push(productItems[index])
  }

  return mixed.slice(0, 12)
}

function buildStaleCreatorList(kols: Kol[], timelineEvents: CreatorProductEvent[]) {
  const latestByCreator = new Map<string, string>()
  for (const event of timelineEvents) {
    const current = latestByCreator.get(event.creator_id) ?? ""
    latestByCreator.set(event.creator_id, event.event_date > current ? event.event_date : current)
  }

  return [...kols]
    .sort((a, b) => {
      const aLatest = latestByCreator.get(a.id) ?? ""
      const bLatest = latestByCreator.get(b.id) ?? ""
      return aLatest.localeCompare(bLatest) || b.trustscore - a.trustscore
    })
    .slice(0, 8)
    .map(({ id, name, avatar, platform }) => ({ id, name, avatar, platform }))
}

export function getHomeRecencyLabel(date: string) {
  return recencyLabel(date)
}

export function buildHomeDailyBriefing({
  posts,
  products,
  timelineEvents,
  kols,
}: {
  posts: Post[]
  products: Product[]
  timelineEvents: CreatorProductEvent[]
  kols: Kol[]
}): HomeDailyBriefing {
  const creatorMap = new Map(kols.map((kol) => [kol.id, kol]))
  const productMap = new Map(products.map((product) => [product.id, product]))
  const productSignals = buildProductSignals(products, timelineEvents, creatorMap)
  const creatorUpdates = buildCreatorUpdates(timelineEvents, creatorMap, productMap)
  const editorialPlan = buildDailyEditorialPlan({ posts, products, timelineEvents, kols })
  const dailyUpdates = buildDailyUpdates(posts, creatorUpdates, productSignals, editorialPlan.candidates)
  const leadPost = editorialPlan.leadStory?.post ?? posts[0]

  return {
    leadStory: leadPost
      ? {
          kind: "article",
          title: leadPost.title,
          excerpt: editorialPlan.leadStory?.reason ?? leadPost.excerpt,
          href: editorialPlan.leadStory?.href ?? postHref(leadPost),
          date: leadPost.created_at,
          image: leadPost.image,
          avatar: leadPost.author_avatar,
          label: editorialPlan.leadStory?.label ?? leadPost.category,
          sourceName: leadPost.author_name || "Beauty Desk",
        }
      : null,
    dailyUpdates,
    creatorUpdates: creatorUpdates.slice(0, 12),
    productSignals: productSignals.slice(0, 12),
    cataloguePrompts: topCatalogueNavigation
      .map((item) => catalogueSections.find((section) => section.slug === item.slug))
      .filter((section): section is CatalogueSection => Boolean(section))
      .slice(0, 10),
    staleOrNeedsUpdate: buildStaleCreatorList(kols, timelineEvents),
    editorialPlan,
  }
}

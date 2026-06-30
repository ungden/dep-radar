import { catalogueSections } from "@/lib/catalogue"
import { getContentMatrix, getMatrixNodeByArticleSlug, getMatrixProductGroups } from "@/lib/content-matrix"
import type { CreatorProductEvent, Kol, Post, Product } from "@/lib/types"

export type ContentGraphEdgeKind =
  | "next_read"
  | "same_hub"
  | "same_stage"
  | "shared_product_group"
  | "shared_product"
  | "shared_kol"
  | "related_node"
  | "same_category"
  | "shared_tag"

export interface RelatedArticle {
  post: Post
  href: string
  score: number
  reasons: string[]
  edgeKinds: ContentGraphEdgeKind[]
}

export interface DailyEditorialCandidate {
  post: Post
  href: string
  score: number
  freshnessScore: number
  relationScore: number
  trustScore: number
  diversityKey: string
  label: string
  reason: string
}

export interface ContentGraphCoverage {
  hubSlug: string
  hubTitle: string
  posts: number
  matrixNodes: number
  postsWithNextReads: number
  postsWithProductGroups: number
  postsWithKols: number
  coverageScore: number
}

export interface DailyEditorialPlan {
  leadStory: DailyEditorialCandidate | null
  candidates: DailyEditorialCandidate[]
  coverage: ContentGraphCoverage[]
}

type ScoreEntry = {
  post: Post
  score: number
  reasons: Set<string>
  edgeKinds: Set<ContentGraphEdgeKind>
}

const EDGE_REASONS: Record<ContentGraphEdgeKind, string> = {
  next_read: "Bước đọc tiếp trong lộ trình",
  same_hub: "Cùng hub làm đẹp",
  same_stage: "Cùng giai đoạn nghiên cứu",
  shared_product_group: "Cùng nhóm sản phẩm cần cân nhắc",
  shared_product: "Nhắc cùng sản phẩm",
  shared_kol: "Liên quan cùng KOL/KOC",
  related_node: "Nối từ node liên quan trong ma trận",
  same_category: "Cùng chủ đề biên tập",
  shared_tag: "Có tag nội dung giao nhau",
}

export function articleHref(post: Pick<Post, "id" | "slug">) {
  return `/blog/${post.slug || post.id}`
}

export function getGraphNodeForPost(post: Post) {
  return getMatrixNodeByArticleSlug(post.slug) ?? (post.hubSlug ? getContentMatrix(post.hubSlug)?.nodes[0] : undefined)
}

export function buildRelatedArticles({
  post,
  posts,
  limit = 6,
}: {
  post: Post
  posts: Post[]
  products?: Product[]
  kols?: Kol[]
  limit?: number
}): RelatedArticle[] {
  const publishedPosts = posts.filter((item) => item.status !== "draft" && item.status !== "planned" && item.id !== post.id)
  const postsBySlug = new Map(publishedPosts.map((item) => [item.slug, item]))
  const entries = new Map<string, ScoreEntry>()
  const matrixNode = getGraphNodeForPost(post)
  const productGroupKeys = new Set([...(matrixNode?.productGroupKeys ?? []), ...(post.productGroupKeys ?? [])])
  const productGroups = getMatrixProductGroups([...productGroupKeys])
  const productIds = new Set([
    ...(matrixNode?.productIds ?? []),
    ...(post.matrixProductIds ?? []),
    ...(post.product_ids ?? []),
    ...productGroups.flatMap((group) => [...group.productIds, ...group.comparisonProductIds]),
  ])
  const kolIds = new Set([
    ...(matrixNode?.kolIds ?? []),
    ...(post.kolIds ?? []),
    ...productGroups.flatMap((group) => group.recommendedKolIds),
  ])
  const nextSlugs = [
    ...(matrixNode?.nextArticleSlugs ?? []),
    ...(post.nextArticleSlugs ?? []),
  ]
  const groupRelatedSlugs = productGroups.flatMap((group) => group.relatedArticleSlugs)
  const relatedNodeSlugs = (matrixNode?.relatedNodeKeys ?? post.relatedNodeKeys ?? [])
    .map((nodeKey) => findNodeArticleSlug(nodeKey))
    .filter((slug): slug is string => Boolean(slug))

  addExplicit(nextSlugs, 120, "next_read")
  addExplicit(groupRelatedSlugs, 92, "shared_product_group")
  addExplicit(relatedNodeSlugs, 84, "related_node")

  for (const candidate of publishedPosts) {
    if (candidate.id === post.id || candidate.slug === post.slug) continue
    const candidateNode = getGraphNodeForPost(candidate)
    const candidateGroupKeys = new Set([...(candidateNode?.productGroupKeys ?? []), ...(candidate.productGroupKeys ?? [])])
    const candidateGroups = getMatrixProductGroups([...candidateGroupKeys])
    const candidateProductIds = new Set([
      ...(candidateNode?.productIds ?? []),
      ...(candidate.matrixProductIds ?? []),
      ...(candidate.product_ids ?? []),
      ...candidateGroups.flatMap((group) => [...group.productIds, ...group.comparisonProductIds]),
    ])
    const candidateKolIds = new Set([
      ...(candidateNode?.kolIds ?? []),
      ...(candidate.kolIds ?? []),
      ...candidateGroups.flatMap((group) => group.recommendedKolIds),
    ])

    if (post.hubSlug && candidate.hubSlug === post.hubSlug) add(candidate, 18, "same_hub")
    if ((matrixNode?.stage ?? post.researchStage) && (matrixNode?.stage ?? post.researchStage) === (candidateNode?.stage ?? candidate.researchStage)) {
      add(candidate, 18, "same_stage")
    }
    if (post.category && candidate.category === post.category) add(candidate, 12, "same_category")
    if (overlap(productGroupKeys, candidateGroupKeys)) add(candidate, 34, "shared_product_group")
    if (overlap(productIds, candidateProductIds)) add(candidate, 28, "shared_product")
    if (overlap(kolIds, candidateKolIds)) add(candidate, 20, "shared_kol")
    if (overlap(new Set(post.tags ?? []), new Set(candidate.tags ?? []))) add(candidate, 10, "shared_tag")
  }

  return [...entries.values()]
    .sort((a, b) => b.score - a.score || b.post.created_at.localeCompare(a.post.created_at))
    .slice(0, limit)
    .map((entry) => ({
      post: entry.post,
      href: articleHref(entry.post),
      score: entry.score,
      reasons: [...entry.reasons].slice(0, 3),
      edgeKinds: [...entry.edgeKinds],
    }))

  function addExplicit(slugs: string[], score: number, edgeKind: ContentGraphEdgeKind) {
    for (const slug of slugs) {
      const candidate = postsBySlug.get(slug)
      if (candidate) add(candidate, score, edgeKind)
    }
  }

  function add(candidate: Post, score: number, edgeKind: ContentGraphEdgeKind) {
    const key = candidate.slug || candidate.id
    const current = entries.get(key) ?? {
      post: candidate,
      score: 0,
      reasons: new Set<string>(),
      edgeKinds: new Set<ContentGraphEdgeKind>(),
    }
    current.score += score
    current.reasons.add(EDGE_REASONS[edgeKind])
    current.edgeKinds.add(edgeKind)
    entries.set(key, current)
  }
}

export function buildDailyEditorialPlan({
  posts,
  products,
  timelineEvents,
  kols,
  limit = 12,
}: {
  posts: Post[]
  products: Product[]
  timelineEvents: CreatorProductEvent[]
  kols: Kol[]
  limit?: number
}): DailyEditorialPlan {
  const publishedPosts = posts.filter((post) => post.status !== "draft" && post.status !== "planned")
  const productMentionCounts = countBy(timelineEvents.map((event) => event.product_id))
  const creatorMentionCounts = countBy(timelineEvents.map((event) => event.creator_id))
  const productMap = new Map(products.map((product) => [product.id, product]))
  const kolMap = new Map(kols.map((kol) => [kol.id, kol]))
  const coverage = buildContentGraphCoverage(publishedPosts)

  const candidates = publishedPosts
    .map((post): DailyEditorialCandidate => {
      const matrixNode = getGraphNodeForPost(post)
      const productGroups = getMatrixProductGroups(matrixNode?.productGroupKeys ?? post.productGroupKeys ?? [])
      const graphProductIds = [
        ...(matrixNode?.productIds ?? post.matrixProductIds ?? []),
        ...(post.product_ids ?? []),
        ...productGroups.flatMap((group) => [...group.productIds, ...group.comparisonProductIds]),
      ]
      const graphKolIds = [
        ...(matrixNode?.kolIds ?? post.kolIds ?? []),
        ...productGroups.flatMap((group) => group.recommendedKolIds),
      ]
      const related = buildRelatedArticles({ post, posts: publishedPosts, limit: 8 })
      const freshnessScore = freshnessScoreFor(post.created_at)
      const relationScore = Math.min(45, related.length * 5 + productGroups.length * 4 + graphKolIds.length * 3)
      const trustScore = Math.min(30, (post.sourceNotes?.length ?? 0) * 8 + (post.takeaways?.length ? 7 : 0) + (post.faq?.length ? 7 : 0))
      const signalScore = Math.min(
        25,
        graphProductIds.reduce((sum, id) => sum + (productMentionCounts.get(id) ?? 0), 0) * 3 +
          graphKolIds.reduce((sum, id) => sum + (creatorMentionCounts.get(id) ?? 0), 0) * 2
      )
      const safetyBoost = post.medicalDisclaimerLevel === "medical" && post.sourceNotes?.length ? 8 : 0
      const score = freshnessScore + relationScore + trustScore + signalScore + safetyBoost
      const productNames = graphProductIds.map((id) => productMap.get(id)?.name).filter(Boolean)
      const kolNames = graphKolIds.map((id) => kolMap.get(id)?.name).filter(Boolean)

      return {
        post,
        href: articleHref(post),
        score,
        freshnessScore,
        relationScore,
        trustScore,
        diversityKey: post.hubSlug || post.category || "beauty-desk",
        label: labelForCandidate(post, matrixNode?.stage),
        reason: reasonForCandidate({ productNames, kolNames, relatedCount: related.length, sourceCount: post.sourceNotes?.length ?? 0 }),
      }
    })
    .sort((a, b) => b.score - a.score || b.post.created_at.localeCompare(a.post.created_at))

  return {
    leadStory: pickDiverseCandidates(candidates, 1)[0] ?? candidates[0] ?? null,
    candidates: pickDiverseCandidates(candidates, limit),
    coverage,
  }
}

export function buildContentGraphCoverage(posts: Post[]): ContentGraphCoverage[] {
  return catalogueSections.map((hub) => {
    const hubPosts = posts.filter((post) => post.hubSlug === hub.slug || post.category === hub.title)
    const matrix = getContentMatrix(hub.slug)
    const postsWithNextReads = hubPosts.filter((post) => getGraphNodeForPost(post)?.nextArticleSlugs.length || post.nextArticleSlugs?.length).length
    const postsWithProductGroups = hubPosts.filter((post) => getGraphNodeForPost(post)?.productGroupKeys.length || post.productGroupKeys?.length).length
    const postsWithKols = hubPosts.filter((post) => getGraphNodeForPost(post)?.kolIds.length || post.kolIds?.length).length
    const coverageScore = hubPosts.length === 0
      ? 0
      : Math.round(((postsWithNextReads + postsWithProductGroups + postsWithKols) / (hubPosts.length * 3)) * 100)

    return {
      hubSlug: hub.slug,
      hubTitle: hub.title,
      posts: hubPosts.length,
      matrixNodes: matrix?.nodes.length ?? 0,
      postsWithNextReads,
      postsWithProductGroups,
      postsWithKols,
      coverageScore,
    }
  })
}

function findNodeArticleSlug(nodeKey: string) {
  for (const section of catalogueSections) {
    const node = getContentMatrix(section.slug)?.nodes.find((item) => item.key === nodeKey)
    if (node) return node.articleSlug
  }
  return null
}

function overlap<T>(a: Set<T>, b: Set<T>) {
  if (a.size === 0 || b.size === 0) return false
  for (const item of a) {
    if (b.has(item)) return true
  }
  return false
}

function countBy(items: string[]) {
  const map = new Map<string, number>()
  for (const item of items) map.set(item, (map.get(item) ?? 0) + 1)
  return map
}

function freshnessScoreFor(date: string) {
  const timestamp = new Date(date).getTime()
  if (!Number.isFinite(timestamp)) return 8
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
  if (days <= 1) return 30
  if (days <= 7) return 24
  if (days <= 30) return 17
  if (days <= 120) return 10
  return 6
}

function labelForCandidate(post: Post, stage?: string) {
  if (stage === "safety" || post.medicalDisclaimerLevel === "medical") return "An toàn & kiểm chứng"
  if (post.kolIds?.length) return "Có KOL/KOC liên quan"
  if (post.productGroupKeys?.length || post.product_ids?.length) return "Có product context"
  return post.category
}

function reasonForCandidate({
  productNames,
  kolNames,
  relatedCount,
  sourceCount,
}: {
  productNames: (string | undefined)[]
  kolNames: (string | undefined)[]
  relatedCount: number
  sourceCount: number
}) {
  if (kolNames.length > 0) return `Nối được với ${kolNames.slice(0, 2).join(", ")} và ${relatedCount} bài đọc tiếp.`
  if (productNames.length > 0) return `Có ngữ cảnh sản phẩm như ${productNames.slice(0, 2).join(", ")} nhưng vẫn đi từ vấn đề trước.`
  if (sourceCount > 0) return `Có nguồn tham khảo và ${relatedCount} hướng đọc tiếp trong graph.`
  return `Có ${relatedCount} bài liên quan để kéo người đọc sang chủ đề kế tiếp.`
}

function pickDiverseCandidates(candidates: DailyEditorialCandidate[], limit: number) {
  const picked: DailyEditorialCandidate[] = []
  const byKey = new Map<string, number>()

  for (const candidate of candidates) {
    const used = byKey.get(candidate.diversityKey) ?? 0
    if (used >= 2 && picked.length < Math.min(limit, 8)) continue
    picked.push(candidate)
    byKey.set(candidate.diversityKey, used + 1)
    if (picked.length >= limit) break
  }

  return picked
}

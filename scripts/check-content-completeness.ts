import fs from "node:fs"

import { catalogueSections, getProductCatalogueMappingStatus, getProductCatalogueSlugs } from "@/lib/catalogue"
import { getCatalogueArticle } from "@/lib/catalogue-articles"
import { getCatalogueEducation } from "@/lib/catalogue-education"
import { getCatalogueGuide } from "@/lib/catalogue-guide"
import { getContentMatrix } from "@/lib/content-matrix"
import { getPosts, getProducts } from "@/lib/data"
import { PLANNED_EDITORIAL_BRIEFS, PUBLISHED_EDITORIAL_BRIEFS } from "@/lib/editorial"
import { EDITORIAL_TOPIC_GUIDANCE } from "@/lib/editorial-topic-guidance"

async function main() {
  const posts = await getPosts()
  const products = await getProducts()
  const communitySource = fs.readFileSync("app/community/page.tsx", "utf8")
  const reviewSource = fs.readFileSync("components/real-review-panel.tsx", "utf8")
  const commentSource = fs.readFileSync("components/comment-section.tsx", "utf8")
  const ratingSource = fs.readFileSync("components/user-rating.tsx", "utf8")
  const adminTimelineSource = fs.readFileSync("app/admin/timeline/page.tsx", "utf8")
  const adminOffersSource = fs.readFileSync("app/admin/offers/page.tsx", "utf8")
  const errors: string[] = []

  for (const section of catalogueSections) {
    if (!getCatalogueGuide(section.slug)) errors.push(`${section.slug}: missing guide`)
    if (!getCatalogueEducation(section.slug)) errors.push(`${section.slug}: missing education`)
    if (!getCatalogueArticle(section.slug)) errors.push(`${section.slug}: missing foundation article`)
    if (!getContentMatrix(section.slug)) errors.push(`${section.slug}: missing content matrix`)
  }

  for (const post of posts) {
    if (!post.hubSlug) errors.push(`${post.slug}: missing canonical hub`)
    if (!post.intent || !post.researchStage || !post.conditionSlugs || !post.nextArticleSlugs) errors.push(`${post.slug}: incomplete public metadata`)
    if (!post.sourceNotes?.length) errors.push(`${post.slug}: public article has no sources`)
    if (post.content.trim().length < 500) errors.push(`${post.slug}: public article is too short`)
    if (post.likes !== 0 || post.comments !== 0) errors.push(`${post.slug}: unverified social proof is public`)
  }

  for (const product of products) {
    if (!product.source_url || !product.source_label || !product.source_type) errors.push(`${product.id}: missing product provenance`)
    if (product.description.trim().length < 55) errors.push(`${product.id}: product description is too short`)
    if (getProductCatalogueMappingStatus(product) !== "mapped" || getProductCatalogueSlugs(product).length === 0) errors.push(`${product.id}: product mapping is not approved`)
    if (product.price === "Đang cập nhật") errors.push(`${product.id}: ambiguous price placeholder is public`)
  }

  const creatorClaimPattern = /Góc Của Rư|Kim Chung Phan|Call Me Duy|Skincare Đúng Cách|Vũ Thái Bình|được Tôm nhắc/i
  const unsupportedCreatorClaims = products.filter((product) => creatorClaimPattern.test(product.description))
  if (unsupportedCreatorClaims.length) errors.push(`product descriptions contain creator claims without event evidence: ${unsupportedCreatorClaims.map((product) => product.id).join(", ")}`)

  if (PUBLISHED_EDITORIAL_BRIEFS.length !== 112 || posts.length !== 112) errors.push(`expected 112 completed public articles, found ${PUBLISHED_EDITORIAL_BRIEFS.length} briefs and ${posts.length} posts`)
  if (PLANNED_EDITORIAL_BRIEFS.length !== 0) errors.push(`${PLANNED_EDITORIAL_BRIEFS.length} editorial articles are still unfinished`)
  if (Object.keys(EDITORIAL_TOPIC_GUIDANCE).length !== 70) errors.push("topic-specific guidance does not cover all 70 roadmap articles")
  const contentBodies = new Set(posts.map((post) => post.content.trim()))
  if (contentBodies.size !== posts.length) errors.push("public editorial contains duplicate article bodies")
  if (/getPosts|local-|handleCreatePost/.test(communitySource)) errors.push("community still uses editorial or local-only mock posts")
  if (/Đã nhận review ở chế độ demo/.test(reviewSource)) errors.push("review form still reports fake demo success")
  if (/id: `local-|setSubmitted\(true\)[\s\S]{0,100}!isSupabaseSchemaReady/.test(commentSource + ratingSource)) errors.push("community interaction still creates local-only success")
  if (/SAMPLE_CREATOR_PRODUCT_EVENTS|SAMPLE_PRODUCT_OFFERS|SAMPLE_PRODUCT_REFERENCES/.test(adminTimelineSource + adminOffersSource)) errors.push("admin data pages still fall back to sample operational records")

  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"))
    process.exit(1)
  }

  console.log(JSON.stringify({
    catalogueHubs: catalogueSections.length,
    publishedSourcedArticles: posts.length,
    completedPublishedArticles: PUBLISHED_EDITORIAL_BRIEFS.length,
    unfinishedArticles: PLANNED_EDITORIAL_BRIEFS.length,
    sourcedProducts: products.length,
    verifiedSocialProofSeeds: 0,
    communityMode: "approved persisted reviews only",
  }, null, 2))
}

void main()

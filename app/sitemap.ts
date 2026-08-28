import type { MetadataRoute } from 'next'
import { catalogueSections } from '@/lib/catalogue'
import { getKols, getPosts, getProducts } from '@/lib/data'
import { dateOrNow, getSiteUrl, postPath } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl()

  const [products, posts, kols] = await Promise.all([
    getProducts(),
    getPosts(),
    getKols(),
  ])
  const publishedPosts = posts.filter((post) => post.status === undefined || post.status === 'published')

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/catalogue`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/koc-tracker`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/community`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ]

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const postPages: MetadataRoute.Sitemap = publishedPosts.map((post) => ({
    url: `${baseUrl}${postPath(post)}`,
    lastModified: dateOrNow(post.refreshedAt || post.lastVerifiedAt || post.publishedAt || post.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const kolPages: MetadataRoute.Sitemap = kols.map((kol) => ({
    url: `${baseUrl}/koc-tracker/${kol.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const cataloguePages: MetadataRoute.Sitemap = catalogueSections.map((section) => ({
    url: `${baseUrl}/catalogue/${section.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: section.topMenu ? 0.8 : 0.65,
  }))

  return [...staticPages, ...cataloguePages, ...productPages, ...postPages, ...kolPages]
}

import type { Post } from "@/lib/types"

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://360dep.vn").replace(/\/$/, "")
}

export function absoluteUrl(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) return `${getSiteUrl()}/brand/social-share.jpg`
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${getSiteUrl()}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`
}

export function postPath(post: Pick<Post, "id" | "slug">) {
  return `/blog/${post.slug || post.id}`
}

export function dateOrNow(value?: string | null) {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date() : date
}

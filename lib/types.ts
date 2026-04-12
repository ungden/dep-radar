export interface Product {
  id: string
  name: string
  brand: string
  image: string
  description: string
  rating: number
  reviews: number
  sold: string
  price: string
  category: string
  tags: string[]
  affiliate_url: string | null
}

export interface Kol {
  id: string
  name: string
  avatar: string
  cover: string
  platform: string
  handle: string
  followers: string
  recentreview: string
  trustscore: number
  categories: string[]
  verified: boolean
}

export interface Review {
  id: string
  kolid: string
  productid: string
  rating: number
  ispr: boolean
  timeago: string
  content: string
  likes: number
  comments: number
}

export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author_name: string
  author_avatar: string
  category: string
  tags: string[]
  image: string
  likes: number
  comments: number
  created_at: string
  product_ids: string[]
}

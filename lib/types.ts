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

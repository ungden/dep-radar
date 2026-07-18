"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Star, Heart, MessageSquare, LogOut, User, BookmarkCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { isSupabaseSchemaReady, supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { Product } from "@/lib/types"

interface Profile {
  full_name: string | null
  avatar_url: string | null
}

interface WishlistItem {
  id: string
  product_id: string
  product?: Product | null
}

interface UserRatingItem {
  id: string
  product_id: string
  rating: number
  review: string | null
  created_at: string
  product?: Product | null
}

interface UserComment {
  id: string
  content: string
  created_at: string
  post_id: string | null
  product_id: string | null
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "vừa xong"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} tháng trước`
  return `${Math.floor(months / 12)} năm trước`
}

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [wishlist, setWishlist] = React.useState<WishlistItem[]>([])
  const [ratings, setRatings] = React.useState<UserRatingItem[]>([])
  const [comments, setComments] = React.useState<UserComment[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push("/auth/login")
      return
    }
    if (!isSupabaseSchemaReady) {
      setProfile({
        full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      })
      setWishlist([])
      setRatings([])
      setComments([])
      setLoading(false)
      return
    }

    const fetchData = async () => {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()

      setProfile(profileData)

      // Fetch wishlist with product details
      const { data: wishlistData } = await supabase
        .from("wishlist")
        .select("id, product_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (wishlistData && wishlistData.length > 0) {
        const productIds = wishlistData.map((w) => w.product_id)
        const { data: products } = await supabase
          .from("radar_products")
          .select("*")
          .in("id", productIds)

        const productsMap = new Map((products || []).map((p) => [p.id, p]))
        setWishlist(
          wishlistData.map((w) => ({
            ...w,
            product: productsMap.get(w.product_id) || null,
          }))
        )
      }

      // Fetch user ratings with product details
      const { data: ratingsData } = await supabase
        .from("user_ratings")
        .select("id, product_id, rating, review, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (ratingsData && ratingsData.length > 0) {
        const productIds = ratingsData.map((r) => r.product_id)
        const { data: products } = await supabase
          .from("radar_products")
          .select("*")
          .in("id", productIds)

        const productsMap = new Map((products || []).map((p) => [p.id, p]))
        setRatings(
          ratingsData.map((r) => ({
            ...r,
            product: productsMap.get(r.product_id) || null,
          }))
        )
      }

      // Fetch user comments
      const { data: commentsData } = await supabase
        .from("comments")
        .select("id, content, created_at, post_id, product_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setComments(commentsData || [])
      setLoading(false)
    }

    fetchData()
  }, [user, authLoading, router])

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Người dùng"
  const initial = displayName[0]?.toUpperCase() || "N"

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* User info card */}
        <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-rose-100 dark:border-rose-900/30">
                <AvatarFallback className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xl font-bold">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 truncate">
                  {displayName}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <BookmarkCheck className="h-4 w-4" />
                  <span>{wishlist.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span>{ratings.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{comments.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="wishlist" className="space-y-6">
          <TabsList className="w-full grid grid-cols-3 rounded-xl">
            <TabsTrigger value="wishlist" className="gap-1.5 text-xs sm:text-sm">
              <Heart className="h-4 w-4 hidden sm:block" />
              Yêu thích
            </TabsTrigger>
            <TabsTrigger value="ratings" className="gap-1.5 text-xs sm:text-sm">
              <Star className="h-4 w-4 hidden sm:block" />
              Đánh giá của tôi
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-1.5 text-xs sm:text-sm">
              <MessageSquare className="h-4 w-4 hidden sm:block" />
              Bình luận
            </TabsTrigger>
          </TabsList>

          {/* Wishlist tab */}
          <TabsContent value="wishlist">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : wishlist.length === 0 ? (
              <EmptyState
                icon={Heart}
                text="Bạn chưa lưu sản phẩm nào"
                subtext="Nhấn vào biểu tượng bookmark trên sản phẩm để thêm vào danh sách yêu thích"
              />
            ) : (
              <div className="space-y-3">
                {wishlist.map((item) => (
                  <ProductCard key={item.id} product={item.product} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Ratings tab */}
          <TabsContent value="ratings">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                ))}
              </div>
            ) : ratings.length === 0 ? (
              <EmptyState
                icon={Star}
                text="Bạn chưa đánh giá sản phẩm nào"
                subtext="Ghé trang chi tiết sản phẩm để chia sẻ đánh giá của bạn"
              />
            ) : (
              <div className="space-y-3">
                {ratings.map((item) => (
                  <Card
                    key={item.id}
                    className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm"
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {item.product?.image && (
                          <Link href={`/products/${item.product_id}`}>
                            <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                              <Image
                                src={item.product.image}
                                alt={item.product.name}
                                fill
                                sizes="64px"
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </Link>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${item.product_id}`}
                            className="font-semibold text-sm text-slate-900 dark:text-slate-50 hover:text-rose-500 dark:hover:text-rose-400 transition-colors line-clamp-1"
                          >
                            {item.product?.name || "Sản phẩm"}
                          </Link>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-3.5 w-3.5",
                                  i < item.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-slate-200 dark:fill-slate-700 text-slate-200 dark:text-slate-700"
                                )}
                              />
                            ))}
                            <span className="text-xs text-slate-400 ml-1">
                              {timeAgo(item.created_at)}
                            </span>
                          </div>
                          {item.review && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                              {item.review}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Comments tab */}
          <TabsContent value="comments">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : comments.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                text="Bạn chưa có bình luận nào"
                subtext="Tham gia thảo luận về sản phẩm và bài viết trên 360 đẹp"
              />
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <Card
                    key={comment.id}
                    className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm"
                  >
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 dark:text-slate-500">
                        <span>{timeAgo(comment.created_at)}</span>
                        {comment.product_id && (
                          <>
                            <span>&bull;</span>
                            <Link
                              href={`/products/${comment.product_id}`}
                              className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
                            >
                              Xem sản phẩm
                            </Link>
                          </>
                        )}
                        {comment.post_id && (
                          <>
                            <span>&bull;</span>
                            <Link
                              href={`/blog/${comment.post_id}`}
                              className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
                            >
                              Xem bài viết
                            </Link>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Sign out */}
        <div className="mt-10 text-center">
          <Button
            variant="outline"
            onClick={async () => {
              await signOut()
              router.push("/")
            }}
            className="rounded-xl gap-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product }: { product?: Product | null }) {
  if (!product) return null

  return (
    <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <Link href={`/products/${product.id}`} className="flex gap-4 group">
          <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="64px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-rose-500 uppercase tracking-wider">
              {product.brand}
            </p>
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-50 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
              {product.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {product.reviews > 0 ? product.rating : "Chưa có đánh giá"}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
                {product.price}
              </span>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  icon: Icon,
  text,
  subtext,
}: {
  icon: React.ElementType
  text: string
  subtext: string
}) {
  return (
    <div className="text-center py-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 border-dashed">
      <Icon className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <p className="font-medium text-slate-600 dark:text-slate-400">{text}</p>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
        {subtext}
      </p>
    </div>
  )
}

import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Star, ShieldCheck, CirclePlay, ArrowLeft, ExternalLink, Users, Award } from "lucide-react"
import * as motion from "motion/react-client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

export default async function KocDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { data: kol } = await supabase.from('kols').select('*').eq('id', id).single();
  if (!kol) return notFound();

  const { data: kolReviews } = await supabase.from('reviews').select('*').eq('kolid', id);
  const { data: productsData } = await supabase.from('radar_products').select('*');
  const PRODUCTS = productsData || [];
  const reviews = kolReviews || [];
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Cover Image */}
      <div className="h-64 md:h-80 w-full bg-slate-200 dark:bg-slate-800 relative">
        <Image
          src={kol.cover}
          alt="Cover"
          fill
          className="object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 dark:from-slate-950/80 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/koc-tracker" className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white mb-6 transition-colors drop-shadow-md">
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại danh sách
          </Link>

          {/* Profile Header */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800 mb-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white dark:border-slate-900 shadow-xl ring-4 ring-slate-50 dark:ring-slate-800">
              <AvatarImage src={kol.avatar} />
              <AvatarFallback>{kol.name[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-slate-50">{kol.name}</h1>
                {kol.verified && <ShieldCheck className="h-8 w-8 text-blue-500" />}
              </div>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {kol.platform === "Youtube" ? (
                  <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-1 rounded-full border border-red-100 dark:border-red-900/50 text-xs font-bold uppercase tracking-wider">
                    <CirclePlay className="h-4 w-4" /> Youtube
                  </span>
                ) : kol.platform === "Tiktok" ? (
                  <span className="inline-flex items-center gap-1 text-slate-900 dark:text-slate-50 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    Tiktok
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-900/50 text-xs font-bold uppercase tracking-wider">
                    <CirclePlay className="h-4 w-4" /> {kol.platform}
                  </span>
                )}
                <span className="text-slate-500 dark:text-slate-400 font-medium">{kol.handle}</span>
              </div>
              
              <div className="flex flex-wrap gap-8">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Followers</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{kol.followers}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Độ uy tín</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{kol.trustscore}/100</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-auto flex flex-col gap-3">
              <Button className="w-full md:w-48 h-12 rounded-xl bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold">
                Theo dõi
              </Button>
              <Button variant="outline" className="w-full md:w-48 h-12 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
                <ExternalLink className="h-4 w-4 mr-2" /> Kênh chính thức
              </Button>
            </div>
          </div>

          {/* Recent Reviews */}
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-50 mb-6">Sản phẩm đã đánh giá</h2>
          
          {reviews.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
            >
              {reviews.map((review) => {
                const product = PRODUCTS.find(p => p.id === review.productid);
                if (!product) return null;
                
                return (
                  <motion.div 
                    key={review.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
                    }}
                  >
                    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900 rounded-2xl h-full flex flex-col">
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="flex gap-4 mb-4">
                          <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <Image src={product.image} alt={product.name} fill className="object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex flex-col justify-center">
                            <div className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">{product.brand}</div>
                            <Link href={`/products/${product.id}`} className="font-bold text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400 line-clamp-2 transition-colors">
                              {product.name}
                            </Link>
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mt-auto">
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 dark:fill-slate-700 text-slate-200 dark:text-slate-700"}`} />
                            ))}
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 italic line-clamp-2">
                            &quot;{review.content}&quot;
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 font-medium">KOL này chưa có bài đánh giá nào trên hệ thống.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
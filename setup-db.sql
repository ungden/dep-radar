-- Create KOLS table
CREATE TABLE IF NOT EXISTS public.kols (
    id text PRIMARY KEY,
    name text NOT NULL,
    avatar text,
    cover text,
    platform text,
    handle text,
    followers text,
    trustScore integer,
    categories text[],
    recentReview text,
    verified boolean DEFAULT false
);

-- Create PRODUCTS table (we need to override or use the existing one, 
-- but since the existing one has different schema, let's create a new one named radar_products to avoid conflict, 
-- or just use products if we can, but existing 'products' has 'category_id' uuid, 'price' numeric, etc.
-- Actually, let's create a custom schema or just radar_products to be safe)
CREATE TABLE IF NOT EXISTS public.radar_products (
    id text PRIMARY KEY,
    name text NOT NULL,
    brand text,
    image text,
    rating numeric,
    reviews integer,
    sold text,
    price text,
    category text,
    tags text[],
    description text,
    affiliate_url text
);

ALTER TABLE public.radar_products
ADD COLUMN IF NOT EXISTS affiliate_url text;

-- Create REVIEWS table
CREATE TABLE IF NOT EXISTS public.reviews (
    id text PRIMARY KEY,
    kolId text REFERENCES public.kols(id),
    productId text REFERENCES public.radar_products(id),
    rating integer,
    isPR boolean DEFAULT false,
    timeAgo text,
    content text,
    likes integer,
    comments integer
);

-- Create POSTS table
CREATE TABLE IF NOT EXISTS public.posts (
    id text PRIMARY KEY,
    title text NOT NULL,
    slug text UNIQUE NOT NULL,
    excerpt text,
    content text,
    author_name text NOT NULL,
    author_avatar text,
    category text,
    tags text[],
    image text,
    likes integer DEFAULT 0,
    comments integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    product_ids text[] DEFAULT '{}'
);

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS product_ids text[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    role text NOT NULL DEFAULT 'user',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wishlist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id text NOT NULL REFERENCES public.radar_products(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.user_ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id text NOT NULL REFERENCES public.radar_products(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewer_alias text,
    skin_type text,
    usage_duration text,
    purchase_source text,
    would_repurchase boolean,
    proof_url text,
    linked_kol_id text REFERENCES public.kols(id) ON DELETE SET NULL,
    reviewer_relation text CHECK (reviewer_relation IS NULL OR reviewer_relation IN ('influenced_by', 'compare_with', 'disagree_with')),
    helpful_count integer NOT NULL DEFAULT 0,
    moderation_note text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (user_id, product_id)
);

ALTER TABLE public.user_ratings
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.user_ratings
ADD COLUMN IF NOT EXISTS reviewer_alias text;
ALTER TABLE public.user_ratings
ADD COLUMN IF NOT EXISTS skin_type text;
ALTER TABLE public.user_ratings
ADD COLUMN IF NOT EXISTS usage_duration text;
ALTER TABLE public.user_ratings
ADD COLUMN IF NOT EXISTS purchase_source text;
ALTER TABLE public.user_ratings
ADD COLUMN IF NOT EXISTS would_repurchase boolean;
ALTER TABLE public.user_ratings
ADD COLUMN IF NOT EXISTS proof_url text;
ALTER TABLE public.user_ratings
ADD COLUMN IF NOT EXISTS linked_kol_id text REFERENCES public.kols(id) ON DELETE SET NULL;
ALTER TABLE public.user_ratings
ADD COLUMN IF NOT EXISTS reviewer_relation text CHECK (reviewer_relation IS NULL OR reviewer_relation IN ('influenced_by', 'compare_with', 'disagree_with'));
ALTER TABLE public.user_ratings
ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.user_ratings
ADD COLUMN IF NOT EXISTS moderation_note text;

CREATE INDEX IF NOT EXISTS idx_user_ratings_product_status ON public.user_ratings(product_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_ratings_linked_kol ON public.user_ratings(linked_kol_id) WHERE linked_kol_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
    post_id text REFERENCES public.posts(id) ON DELETE CASCADE,
    product_id text REFERENCES public.radar_products(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CHECK (
        (post_id IS NOT NULL AND product_id IS NULL)
        OR (post_id IS NULL AND product_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS public.likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id text REFERENCES public.posts(id) ON DELETE CASCADE,
    product_id text REFERENCES public.radar_products(id) ON DELETE CASCADE,
    comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    CHECK (
        num_nonnulls(post_id, product_id, comment_id) = 1
    ),
    UNIQUE (user_id, post_id),
    UNIQUE (user_id, product_id),
    UNIQUE (user_id, comment_id)
);

ALTER TABLE public.likes
ADD COLUMN IF NOT EXISTS comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_offers (
    id text PRIMARY KEY,
    product_id text NOT NULL REFERENCES public.radar_products(id) ON DELETE CASCADE,
    marketplace text NOT NULL DEFAULT 'shopee',
    shop_name text NOT NULL,
    seller_url text,
    affiliate_url text,
    price_snapshot text,
    stock_status text NOT NULL DEFAULT 'unknown',
    is_preferred boolean NOT NULL DEFAULT false,
    last_checked_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CHECK (marketplace IN ('shopee', 'lazada', 'tiktok_shop', 'official', 'other')),
    CHECK (stock_status IN ('in_stock', 'out_of_stock', 'unknown'))
);

CREATE INDEX IF NOT EXISTS product_offers_product_id_idx ON public.product_offers(product_id);
CREATE INDEX IF NOT EXISTS product_offers_preferred_idx ON public.product_offers(product_id, is_preferred DESC, last_checked_at DESC);

CREATE TABLE IF NOT EXISTS public.creator_product_events (
    id text PRIMARY KEY,
    creator_id text NOT NULL REFERENCES public.kols(id) ON DELETE CASCADE,
    product_id text NOT NULL REFERENCES public.radar_products(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    event_date date NOT NULL,
    observed_at timestamptz NOT NULL DEFAULT now(),
    source_platform text NOT NULL,
    source_url text,
    source_post_id text,
    source_title text NOT NULL,
    source_excerpt text NOT NULL,
    media_url text,
    sentiment text NOT NULL DEFAULT 'neutral',
    disclosure text NOT NULL DEFAULT 'unknown',
    usage_context text,
    evidence_note text NOT NULL DEFAULT '',
    confidence text NOT NULL DEFAULT 'medium',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CHECK (event_type IN ('first_seen', 'used', 'reviewed', 'recommended', 'disliked', 'emptied', 'repurchased', 'live_sold', 'sponsored')),
    CHECK (sentiment IN ('positive', 'mixed', 'negative', 'neutral')),
    CHECK (disclosure IN ('organic', 'pr', 'sponsored', 'affiliate', 'unknown')),
    CHECK (confidence IN ('high', 'medium', 'low'))
);

CREATE INDEX IF NOT EXISTS creator_product_events_creator_idx ON public.creator_product_events(creator_id, event_date DESC);
CREATE INDEX IF NOT EXISTS creator_product_events_product_idx ON public.creator_product_events(product_id, event_date DESC);
CREATE INDEX IF NOT EXISTS creator_product_events_observed_idx ON public.creator_product_events(observed_at DESC);

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id text NOT NULL REFERENCES public.radar_products(id) ON DELETE CASCADE,
    offer_id text REFERENCES public.product_offers(id) ON DELETE SET NULL,
    clicked_at timestamptz DEFAULT now(),
    referrer text,
    user_agent text
);

ALTER TABLE public.affiliate_clicks
ADD COLUMN IF NOT EXISTS referrer text;

ALTER TABLE public.affiliate_clicks
ADD COLUMN IF NOT EXISTS offer_id text REFERENCES public.product_offers(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
          AND role = 'admin'
    );
$$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.kols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_product_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.kols, public.radar_products, public.reviews, public.posts, public.product_offers, public.creator_product_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kols, public.radar_products, public.reviews, public.posts, public.product_offers, public.creator_product_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.wishlist, public.likes TO authenticated;
GRANT SELECT ON public.user_ratings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.user_ratings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO anon, authenticated;
GRANT INSERT ON public.newsletter_subscribers, public.affiliate_clicks TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Create policies for public access (read-only)
DROP POLICY IF EXISTS "Allow public read-only access on kols" ON public.kols;
DROP POLICY IF EXISTS "Allow public read-only access on radar_products" ON public.radar_products;
DROP POLICY IF EXISTS "Allow public read-only access on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public read-only access on posts" ON public.posts;
DROP POLICY IF EXISTS "Allow public read-only access on product_offers" ON public.product_offers;
DROP POLICY IF EXISTS "Allow public read-only access on creator_product_events" ON public.creator_product_events;
CREATE POLICY "Allow public read-only access on kols" ON public.kols FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read-only access on radar_products" ON public.radar_products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read-only access on reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read-only access on posts" ON public.posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read-only access on product_offers" ON public.product_offers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read-only access on creator_product_events" ON public.creator_product_events FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage kols" ON public.kols;
DROP POLICY IF EXISTS "Admins can manage radar_products" ON public.radar_products;
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can manage product_offers" ON public.product_offers;
DROP POLICY IF EXISTS "Admins can manage creator_product_events" ON public.creator_product_events;
CREATE POLICY "Admins can manage kols" ON public.kols FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage radar_products" ON public.radar_products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage posts" ON public.posts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage product_offers" ON public.product_offers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage creator_product_events" ON public.creator_product_events FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Profiles are readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Profiles are readable" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can read own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can insert own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.wishlist;
CREATE POLICY "Users can read own wishlist" ON public.wishlist FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own wishlist" ON public.wishlist FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own wishlist" ON public.wishlist FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read own ratings" ON public.user_ratings;
DROP POLICY IF EXISTS "Public can read approved ratings" ON public.user_ratings;
DROP POLICY IF EXISTS "Users can insert own ratings" ON public.user_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON public.user_ratings;
DROP POLICY IF EXISTS "Admins can manage user ratings" ON public.user_ratings;
CREATE POLICY "Users can read own ratings" ON public.user_ratings FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Public can read approved ratings" ON public.user_ratings FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Users can insert own ratings" ON public.user_ratings FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id AND status = 'pending');
CREATE POLICY "Users can update own ratings" ON public.user_ratings FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id AND status = 'pending');
CREATE POLICY "Admins can manage user ratings" ON public.user_ratings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Comments are readable" ON public.comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Comments are readable" ON public.comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert own comments" ON public.comments FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Likes are readable" ON public.likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;
CREATE POLICY "Likes are readable" ON public.likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert own likes" ON public.likes FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own likes" ON public.likes FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can record affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can record affiliate clicks" ON public.affiliate_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);

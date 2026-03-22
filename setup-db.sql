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
    description text
);

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

-- Enable Row Level Security (RLS)
ALTER TABLE public.kols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (read-only)
CREATE POLICY "Allow public read-only access on kols" ON public.kols FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access on radar_products" ON public.radar_products FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access on reviews" ON public.reviews FOR SELECT USING (true);

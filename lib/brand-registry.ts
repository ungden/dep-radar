import type { ProductCategoryKey } from "@/lib/types"

export type BeautyBrandSegment =
  | "mass"
  | "masstige"
  | "prestige"
  | "luxury"
  | "dermocosmetic"
  | "professional"
  | "fragrance"
  | "indie"
  | "local-vn"

export type BrandListingPriority = "seed-now" | "high" | "medium" | "watch"

export interface BrandRegistrySource {
  id: string
  label: string
  url: string
}

export interface BeautyBrand {
  slug: string
  name: string
  aliases?: string[]
  parentCompany?: string
  origin: string
  segment: BeautyBrandSegment
  categories: ProductCategoryKey[]
  listingPriority: BrandListingPriority
  marketNotes: string
  sourceIds: string[]
}

export const BRAND_REGISTRY_SOURCES: BrandRegistrySource[] = [
  {
    id: "loreal-portfolio",
    label: "L'Oreal global brands portfolio",
    url: "https://www.loreal.com/en/our-global-brands-portfolio/",
  },
  {
    id: "elc-portfolio",
    label: "The Estee Lauder Companies brand portfolio",
    url: "https://www.elcompanies.com/en/our-brands",
  },
  {
    id: "shiseido-portfolio",
    label: "Shiseido Company brand portfolio",
    url: "https://corp.shiseido.com/en/brands/",
  },
  {
    id: "amorepacific-portfolio",
    label: "Amorepacific brands",
    url: "https://www.apgroup.com/int/en/brands/brands.html",
  },
  {
    id: "unilever-beauty",
    label: "Unilever Beauty and Wellbeing brands",
    url: "https://www.unilever.com/brands/beauty-wellbeing/",
  },
  {
    id: "pg-brands",
    label: "P&G beauty and personal care brands",
    url: "https://www.pg.co.uk/brands/",
  },
  {
    id: "lvmh-beauty",
    label: "LVMH perfumes and cosmetics maisons",
    url: "https://www.lvmh.com/en/our-maisons/perfumes-cosmetics",
  },
  {
    id: "puig-brands",
    label: "Puig beauty and fashion brands",
    url: "https://www.puig.com/en/brands/",
  },
  {
    id: "market-radar",
    label: "360dep.vn market radar seed list",
    url: "https://360dep.vn/products",
  },
]

export const BEAUTY_BRANDS: BeautyBrand[] = [
  brand("loreal-paris", "L'Oreal Paris", ["Loreal", "L'Oreal"], "L'Oreal Groupe", "France", "mass", ["skincare", "makeup", "haircare"], "seed-now", "Mass beauty anchor for skincare, makeup and haircare listing.", ["loreal-portfolio"]),
  brand("maybelline-new-york", "Maybelline New York", ["Maybelline"], "L'Oreal Groupe", "United States", "mass", ["makeup"], "seed-now", "Drugstore makeup benchmark for base, mascara and lip products.", ["loreal-portfolio"]),
  brand("nyx-professional-makeup", "NYX Professional Makeup", ["NYX"], "L'Oreal Groupe", "United States", "mass", ["makeup"], "high", "Affordable color makeup with strong creator/search demand.", ["loreal-portfolio"]),
  brand("garnier", "Garnier", [], "L'Oreal Groupe", "France", "mass", ["skincare", "haircare"], "high", "Mass skincare and haircare brand useful for cleansing, sunscreen and micellar listings.", ["loreal-portfolio"]),
  brand("cerave", "CeraVe", ["Cerave"], "L'Oreal Groupe", "United States", "dermocosmetic", ["skincare", "bodycare"], "seed-now", "Dermocosmetic anchor for gentle cleanser, moisturizer and barrier repair.", ["loreal-portfolio"]),
  brand("la-roche-posay", "La Roche-Posay", ["LRP"], "L'Oreal Groupe", "France", "dermocosmetic", ["skincare", "bodycare"], "seed-now", "Dermocosmetic anchor for sunscreen, acne and sensitive-skin listings.", ["loreal-portfolio"]),
  brand("vichy", "Vichy", [], "L'Oreal Groupe", "France", "dermocosmetic", ["skincare", "bodycare"], "high", "Pharmacy skincare and anti-aging reference brand.", ["loreal-portfolio"]),
  brand("skinceuticals", "SkinCeuticals", [], "L'Oreal Groupe", "United States", "dermocosmetic", ["skincare"], "high", "Premium active skincare reference for vitamin C and antioxidant listings.", ["loreal-portfolio"]),
  brand("lancome", "Lancome", ["Lancôme"], "L'Oreal Groupe", "France", "luxury", ["skincare", "makeup", "fragrance"], "high", "Luxury beauty anchor for serum, cushion, mascara and fragrance.", ["loreal-portfolio"]),
  brand("kiehls", "Kiehl's", ["Kiehls"], "L'Oreal Groupe", "United States", "prestige", ["skincare", "bodycare", "haircare", "men_grooming"], "high", "Prestige skincare with strong cleanser, moisturizer and men grooming relevance.", ["loreal-portfolio"]),
  brand("ysl-beauty", "Yves Saint Laurent Beauty", ["YSL Beauty", "YSL"], "L'Oreal Groupe", "France", "luxury", ["makeup", "fragrance", "skincare"], "high", "Luxury lipstick, cushion and fragrance demand driver.", ["loreal-portfolio"]),
  brand("giorgio-armani-beauty", "Giorgio Armani Beauty", ["Armani Beauty"], "L'Oreal Groupe", "Italy", "luxury", ["makeup", "fragrance", "skincare"], "medium", "Prestige complexion and fragrance reference.", ["loreal-portfolio"]),
  brand("shu-uemura", "Shu Uemura", [], "L'Oreal Groupe", "Japan", "prestige", ["makeup", "skincare", "haircare"], "medium", "Cleansing oil and professional makeup reference.", ["loreal-portfolio"]),
  brand("urban-decay", "Urban Decay", [], "L'Oreal Groupe", "United States", "prestige", ["makeup"], "medium", "Makeup palette, setting spray and color-cosmetic reference.", ["loreal-portfolio"]),
  brand("biotherm", "Biotherm", [], "L'Oreal Groupe", "France", "prestige", ["skincare", "bodycare", "men_grooming"], "watch", "Aquatic skincare and bodycare brand to watch for imported listings.", ["loreal-portfolio"]),
  brand("kerastase", "Kerastase", ["Kérastase"], "L'Oreal Groupe", "France", "professional", ["haircare"], "high", "Salon haircare anchor for hair repair and scalp routines.", ["loreal-portfolio"]),
  brand("redken", "Redken", [], "L'Oreal Groupe", "United States", "professional", ["haircare"], "medium", "Professional haircare for repair, color and scalp listings.", ["loreal-portfolio"]),
  brand("matrix", "Matrix", [], "L'Oreal Groupe", "United States", "professional", ["haircare"], "watch", "Salon haircare brand for future professional listing coverage.", ["loreal-portfolio"]),

  brand("estee-lauder", "Estee Lauder", ["Estée Lauder"], "The Estee Lauder Companies", "United States", "luxury", ["skincare", "makeup", "fragrance"], "high", "Luxury skincare and foundation anchor.", ["elc-portfolio"]),
  brand("clinique", "Clinique", [], "The Estee Lauder Companies", "United States", "prestige", ["skincare", "makeup", "fragrance"], "seed-now", "Dermatologist-positioned prestige brand for sensitive skin and base makeup.", ["elc-portfolio"]),
  brand("mac-cosmetics", "MAC Cosmetics", ["MAC"], "The Estee Lauder Companies", "Canada", "prestige", ["makeup"], "seed-now", "Professional makeup and lipstick reference brand.", ["elc-portfolio"]),
  brand("bobbi-brown", "Bobbi Brown", [], "The Estee Lauder Companies", "United States", "prestige", ["makeup", "skincare"], "high", "Prestige natural complexion and professional makeup brand.", ["elc-portfolio"]),
  brand("la-mer", "La Mer", [], "The Estee Lauder Companies", "United States", "luxury", ["skincare"], "medium", "Ultra-luxury skincare reference for premium comparison content.", ["elc-portfolio"]),
  brand("origins", "Origins", [], "The Estee Lauder Companies", "United States", "prestige", ["skincare", "bodycare"], "medium", "Nature-positioned prestige skincare and mask brand.", ["elc-portfolio"]),
  brand("the-ordinary", "The Ordinary", ["DECIEM"], "The Estee Lauder Companies", "Canada", "masstige", ["skincare"], "seed-now", "Ingredient-led skincare anchor for actives and budget comparisons.", ["elc-portfolio"]),
  brand("dr-jart", "Dr.Jart+", ["Dr Jart", "Dr. Jart+"], "The Estee Lauder Companies", "South Korea", "prestige", ["skincare"], "high", "K-beauty derm-positioned skincare, especially cica and barrier products.", ["elc-portfolio"]),
  brand("too-faced", "Too Faced", [], "The Estee Lauder Companies", "United States", "prestige", ["makeup"], "medium", "Color makeup and mascara demand brand.", ["elc-portfolio"]),
  brand("smashbox", "Smashbox", [], "The Estee Lauder Companies", "United States", "prestige", ["makeup"], "watch", "Primer and complexion reference for makeup comparison listings.", ["elc-portfolio"]),
  brand("jo-malone-london", "Jo Malone London", [], "The Estee Lauder Companies", "United Kingdom", "fragrance", ["fragrance", "bodycare"], "high", "Prestige fragrance and bodycare anchor.", ["elc-portfolio"]),
  brand("le-labo", "Le Labo", [], "The Estee Lauder Companies", "United States", "fragrance", ["fragrance", "bodycare"], "medium", "Niche fragrance anchor for premium scent listings.", ["elc-portfolio"]),
  brand("aveda", "Aveda", [], "The Estee Lauder Companies", "United States", "professional", ["haircare", "bodycare"], "medium", "Prestige haircare and scalp care brand.", ["elc-portfolio"]),

  brand("shiseido", "SHISEIDO", ["Shiseido"], "Shiseido Company", "Japan", "prestige", ["skincare", "makeup", "fragrance"], "seed-now", "J-beauty anchor for sunscreen, skincare and makeup.", ["shiseido-portfolio"]),
  brand("cle-de-peau-beaute", "Cle de Peau Beaute", ["Clé de Peau Beauté", "CDP"], "Shiseido Company", "Japan", "luxury", ["skincare", "makeup"], "medium", "Luxury Japanese skincare and complexion reference.", ["shiseido-portfolio"]),
  brand("nars", "NARS", [], "Shiseido Company", "France", "prestige", ["makeup"], "high", "Prestige complexion, blush and lipstick anchor.", ["shiseido-portfolio"]),
  brand("anessa", "ANESSA", ["Anessa"], "Shiseido Company", "Japan", "prestige", ["skincare"], "seed-now", "Asian sunscreen anchor for high-demand SPF listings.", ["shiseido-portfolio"]),
  brand("elixir", "ELIXIR", ["Elixir"], "Shiseido Company", "Japan", "prestige", ["skincare"], "medium", "Japanese anti-aging skincare brand.", ["shiseido-portfolio"]),
  brand("ipsa", "IPSA", [], "Shiseido Company", "Japan", "prestige", ["skincare", "makeup"], "watch", "J-beauty skincare and base makeup brand.", ["shiseido-portfolio"]),
  brand("drunk-elephant", "Drunk Elephant", [], "Shiseido Company", "United States", "prestige", ["skincare", "bodycare", "haircare"], "high", "Prestige active skincare with strong creator demand.", ["shiseido-portfolio"]),
  brand("narciso-rodriguez", "Narciso Rodriguez", [], "Shiseido Company", "United States", "fragrance", ["fragrance"], "seed-now", "Fragrance brand already represented in seed products.", ["shiseido-portfolio"]),

  brand("sulwhasoo", "Sulwhasoo", [], "Amorepacific", "South Korea", "luxury", ["skincare", "makeup"], "high", "Luxury K-beauty ginseng skincare anchor.", ["amorepacific-portfolio"]),
  brand("laneige", "LANEIGE", ["Laneige"], "Amorepacific", "South Korea", "prestige", ["skincare", "makeup"], "seed-now", "K-beauty hydration, lip sleeping mask and cushion anchor.", ["amorepacific-portfolio"]),
  brand("innisfree", "INNISFREE", ["Innisfree"], "Amorepacific", "South Korea", "masstige", ["skincare", "makeup", "bodycare"], "seed-now", "Accessible K-beauty skincare and sunscreen brand.", ["amorepacific-portfolio"]),
  brand("etude", "ETUDE", ["Etude House"], "Amorepacific", "South Korea", "mass", ["makeup", "skincare"], "high", "K-beauty color makeup and beginner skincare brand.", ["amorepacific-portfolio"]),
  brand("hera", "HERA", [], "Amorepacific", "South Korea", "prestige", ["makeup", "skincare"], "high", "K-beauty cushion and complexion prestige brand.", ["amorepacific-portfolio"]),
  brand("iope", "IOPE", [], "Amorepacific", "South Korea", "prestige", ["skincare", "makeup"], "medium", "Functional K-beauty skincare and cushion brand.", ["amorepacific-portfolio"]),
  brand("mamonde", "Mamonde", [], "Amorepacific", "South Korea", "masstige", ["skincare", "makeup"], "medium", "Floral K-beauty skincare and lip products.", ["amorepacific-portfolio"]),
  brand("primera", "Primera", [], "Amorepacific", "South Korea", "prestige", ["skincare"], "medium", "Barrier and clean-positioned K-beauty skincare.", ["amorepacific-portfolio"]),
  brand("aestura", "Aestura", [], "Amorepacific", "South Korea", "dermocosmetic", ["skincare", "bodycare"], "high", "K-derma barrier skincare with strong moisturizer demand.", ["amorepacific-portfolio"]),
  brand("illiyoon", "ILLIYOON", ["Illiyoon"], "Amorepacific", "South Korea", "masstige", ["skincare", "bodycare"], "high", "K-beauty body and barrier moisturizer brand.", ["amorepacific-portfolio"]),
  brand("cosrx", "COSRX", ["Cosrx"], "Amorepacific", "South Korea", "masstige", ["skincare"], "seed-now", "Acne, snail mucin and barrier care K-beauty anchor.", ["amorepacific-portfolio"]),
  brand("mise-en-scene", "Mise-en-Scene", ["Mise en Scene"], "Amorepacific", "South Korea", "mass", ["haircare"], "medium", "K-beauty haircare listing candidate.", ["amorepacific-portfolio"]),
  brand("ryo", "Ryo", [], "Amorepacific", "South Korea", "mass", ["haircare"], "medium", "Korean scalp and haircare brand.", ["amorepacific-portfolio"]),

  brand("dove", "Dove", [], "Unilever", "United States", "mass", ["bodycare", "haircare", "men_grooming"], "seed-now", "Mass bodycare, deodorant and haircare anchor.", ["unilever-beauty"]),
  brand("vaseline", "Vaseline", [], "Unilever", "United States", "mass", ["bodycare", "skincare"], "seed-now", "Body lotion and slugging/barrier care anchor.", ["unilever-beauty"]),
  brand("ponds", "Pond's", ["Ponds"], "Unilever", "United States", "mass", ["skincare"], "high", "Mass skincare and cleansing brand with Vietnam familiarity.", ["unilever-beauty"]),
  brand("tresemme", "TRESemme", ["TRESemmé"], "Unilever", "United States", "mass", ["haircare"], "high", "Mass haircare and styling brand.", ["unilever-beauty"]),
  brand("sunsilk", "Sunsilk", [], "Unilever", "United Kingdom", "mass", ["haircare"], "medium", "Mass shampoo and conditioner brand.", ["unilever-beauty"]),
  brand("lux", "LUX", ["Lux"], "Unilever", "United Kingdom", "mass", ["bodycare"], "medium", "Body wash and soap brand for bodycare listing.", ["unilever-beauty"]),
  brand("dermalogica", "Dermalogica", [], "Unilever", "United States", "professional", ["skincare"], "medium", "Professional skincare and facial treatment brand.", ["unilever-beauty"]),
  brand("paulas-choice", "Paula's Choice", ["Paulas Choice"], "Unilever", "United States", "masstige", ["skincare"], "seed-now", "Ingredient-led actives, BHA and sunscreen reference.", ["unilever-beauty"]),
  brand("tatcha", "Tatcha", [], "Unilever", "United States", "prestige", ["skincare", "makeup"], "medium", "Prestige skincare with strong moisturizer and primer awareness.", ["unilever-beauty"]),
  brand("hourglass", "Hourglass", [], "Unilever", "United States", "prestige", ["makeup"], "medium", "Prestige makeup and complexion brand.", ["unilever-beauty"]),

  brand("olay", "Olay", [], "Procter & Gamble", "United States", "mass", ["skincare"], "seed-now", "Mass anti-aging and moisturizer anchor.", ["pg-brands"]),
  brand("sk-ii", "SK-II", ["SKII"], "Procter & Gamble", "Japan", "luxury", ["skincare"], "high", "Luxury J-beauty essence and anti-aging reference.", ["pg-brands"]),
  brand("pantene", "Pantene", [], "Procter & Gamble", "Switzerland", "mass", ["haircare"], "high", "Mass haircare anchor.", ["pg-brands"]),
  brand("head-and-shoulders", "Head & Shoulders", ["Head and Shoulders"], "Procter & Gamble", "United States", "mass", ["haircare"], "high", "Anti-dandruff/scalp care anchor.", ["pg-brands"]),
  brand("herbal-essences", "Herbal Essences", [], "Procter & Gamble", "United States", "mass", ["haircare"], "medium", "Mass haircare with fragrance-led positioning.", ["pg-brands"]),
  brand("aussie", "Aussie", [], "Procter & Gamble", "United States", "mass", ["haircare"], "medium", "Affordable hair repair and styling brand.", ["pg-brands"]),
  brand("old-spice", "Old Spice", [], "Procter & Gamble", "United States", "mass", ["men_grooming", "bodycare"], "medium", "Men grooming and deodorant listing candidate.", ["pg-brands"]),

  brand("dior-beauty", "Dior Beauty", ["Dior"], "LVMH", "France", "luxury", ["makeup", "fragrance", "skincare"], "high", "Luxury makeup, fragrance and skincare anchor.", ["lvmh-beauty"]),
  brand("guerlain", "Guerlain", [], "LVMH", "France", "luxury", ["fragrance", "makeup", "skincare"], "medium", "Heritage luxury fragrance and skincare brand.", ["lvmh-beauty"]),
  brand("givenchy-beauty", "Givenchy Beauty", ["Givenchy"], "LVMH", "France", "luxury", ["makeup", "fragrance"], "medium", "Luxury fragrance and makeup brand.", ["lvmh-beauty"]),
  brand("benefit-cosmetics", "Benefit Cosmetics", ["Benefit"], "LVMH", "United States", "prestige", ["makeup", "nails_lash_brow"], "high", "Brow, mascara and cheek makeup anchor.", ["lvmh-beauty"]),
  brand("fenty-beauty", "Fenty Beauty", [], "LVMH", "United States", "prestige", ["makeup", "skincare"], "high", "Inclusive complexion and color makeup reference.", ["lvmh-beauty"]),
  brand("fresh", "Fresh", [], "LVMH", "United States", "prestige", ["skincare", "bodycare"], "medium", "Prestige skincare and lip care brand.", ["lvmh-beauty"]),
  brand("make-up-for-ever", "Make Up For Ever", ["MUFE"], "LVMH", "France", "professional", ["makeup"], "medium", "Professional makeup and base product brand.", ["lvmh-beauty"]),

  brand("charlotte-tilbury", "Charlotte Tilbury", [], "Puig", "United Kingdom", "prestige", ["makeup", "skincare"], "high", "Prestige makeup, complexion and glow-product demand brand.", ["puig-brands"]),
  brand("byredo", "Byredo", [], "Puig", "Sweden", "fragrance", ["fragrance", "makeup", "bodycare"], "medium", "Niche fragrance and luxury beauty brand.", ["puig-brands"]),
  brand("dr-barbara-sturm", "Dr. Barbara Sturm", ["Barbara Sturm"], "Puig", "Germany", "luxury", ["skincare"], "medium", "Ultra-premium skincare and anti-inflammatory positioning.", ["puig-brands"]),
  brand("apivita", "Apivita", [], "Puig", "Greece", "prestige", ["skincare", "haircare", "bodycare"], "watch", "Natural-positioned skincare and haircare.", ["puig-brands"]),
  brand("uriage", "Uriage", [], "Puig", "France", "dermocosmetic", ["skincare", "bodycare"], "high", "French pharmacy skincare and sensitive-skin brand.", ["puig-brands"]),
  brand("isdin", "ISDIN", [], "Puig", "Spain", "dermocosmetic", ["skincare", "bodycare"], "high", "Derm sunscreen and treatment brand for SPF listings.", ["puig-brands"]),
  brand("rabanne", "Rabanne", ["Paco Rabanne"], "Puig", "France", "fragrance", ["fragrance", "makeup"], "medium", "Fragrance-led brand with makeup expansion.", ["puig-brands"]),
  brand("carolina-herrera", "Carolina Herrera", [], "Puig", "United States", "fragrance", ["fragrance", "makeup"], "medium", "Designer fragrance and lipstick brand.", ["puig-brands"]),
  brand("jean-paul-gaultier", "Jean Paul Gaultier", [], "Puig", "France", "fragrance", ["fragrance"], "medium", "Designer fragrance brand.", ["puig-brands"]),
  brand("penhaligons", "Penhaligon's", ["Penhaligons"], "Puig", "United Kingdom", "fragrance", ["fragrance"], "watch", "Niche fragrance brand for premium scent coverage.", ["puig-brands"]),

  brand("bioderma", "Bioderma", [], "NAOS", "France", "dermocosmetic", ["skincare", "bodycare"], "seed-now", "Micellar water and sensitive-skin pharmacy anchor.", ["market-radar"]),
  brand("avene", "Avene", ["Avène"], "Pierre Fabre", "France", "dermocosmetic", ["skincare", "bodycare"], "seed-now", "Sensitive-skin and thermal-water pharmacy anchor.", ["market-radar"]),
  brand("ducray", "Ducray", [], "Pierre Fabre", "France", "dermocosmetic", ["haircare", "skincare"], "medium", "Scalp and dermatology skincare brand.", ["market-radar"]),
  brand("eucerin", "Eucerin", [], "Beiersdorf", "Germany", "dermocosmetic", ["skincare", "bodycare"], "seed-now", "Dermocosmetic sunscreen, body and acne-care anchor.", ["market-radar"]),
  brand("nivea", "Nivea", [], "Beiersdorf", "Germany", "mass", ["skincare", "bodycare", "men_grooming"], "seed-now", "Mass bodycare, lip care, sunscreen and men grooming anchor.", ["market-radar"]),
  brand("sebamed", "Sebamed", [], "Sebapharma", "Germany", "dermocosmetic", ["skincare", "bodycare", "haircare"], "high", "pH-focused sensitive skincare and bodycare brand.", ["market-radar"]),
  brand("svr", "SVR", [], "Laboratoire SVR", "France", "dermocosmetic", ["skincare", "bodycare"], "medium", "French pharmacy skincare and sunscreen brand.", ["market-radar"]),
  brand("filorga", "Filorga", [], "Colgate-Palmolive", "France", "prestige", ["skincare"], "medium", "Anti-aging and clinic-adjacent skincare brand.", ["market-radar"]),
  brand("embryolisse", "Embryolisse", [], "Embryolisse", "France", "dermocosmetic", ["skincare"], "medium", "Moisturizer and makeup-prep reference.", ["market-radar"]),
  brand("isispharma", "ISISPHARMA", ["ISIS Pharma"], "ISISPHARMA", "France", "dermocosmetic", ["skincare"], "watch", "Pigmentation and acne pharmacy skincare candidate.", ["market-radar"]),
  brand("martiderm", "MartiDerm", [], "MartiDerm", "Spain", "dermocosmetic", ["skincare"], "medium", "Ampoule and vitamin C skincare candidate.", ["market-radar"]),
  brand("sesderma", "Sesderma", [], "Sesderma", "Spain", "dermocosmetic", ["skincare"], "medium", "Derm skincare, retinoid and brightening candidate.", ["market-radar"]),

  brand("the-inkey-list", "The INKEY List", ["The Inkey List"], "The INKEY List", "United Kingdom", "masstige", ["skincare", "haircare"], "high", "Ingredient-led affordable skincare and scalp care.", ["market-radar"]),
  brand("good-molecules", "Good Molecules", [], "Good Molecules", "United States", "masstige", ["skincare"], "medium", "Affordable ingredient-led skincare brand.", ["market-radar"]),
  brand("byoma", "BYOMA", ["Byoma"], "Future Beauty Labs", "United Kingdom", "masstige", ["skincare"], "medium", "Barrier care and colorful masstige skincare brand.", ["market-radar"]),
  brand("bubble", "Bubble", [], "Bubble Skincare", "United States", "mass", ["skincare"], "watch", "Gen Z skincare brand to track.", ["market-radar"]),
  brand("naturium", "Naturium", [], "e.l.f. Beauty", "United States", "masstige", ["skincare", "bodycare"], "medium", "Ingredient-led skincare and bodycare candidate.", ["market-radar"]),
  brand("elf-cosmetics", "e.l.f. Cosmetics", ["elf"], "e.l.f. Beauty", "United States", "mass", ["makeup", "skincare"], "high", "Affordable makeup and skincare viral brand.", ["market-radar"]),
  brand("rare-beauty", "Rare Beauty", [], "Rare Beauty", "United States", "prestige", ["makeup"], "high", "Creator-led prestige makeup brand with high social demand.", ["market-radar"]),
  brand("rhode", "rhode", ["Rhode"], "rhode", "United States", "prestige", ["skincare"], "high", "Celebrity-led skincare and lip care brand to watch for demand.", ["market-radar"]),
  brand("summer-fridays", "Summer Fridays", [], "Summer Fridays", "United States", "prestige", ["skincare", "bodycare"], "medium", "Lip balm, moisturizer and bodycare social-demand brand.", ["market-radar"]),
  brand("glossier", "Glossier", [], "Glossier", "United States", "prestige", ["makeup", "skincare", "fragrance"], "medium", "Minimal makeup and skin-first beauty brand.", ["market-radar"]),
  brand("milk-makeup", "Milk Makeup", [], "Milk Makeup", "United States", "prestige", ["makeup", "skincare"], "medium", "Stick-format makeup and primer brand.", ["market-radar"]),
  brand("kosas", "Kosas", [], "Kosas", "United States", "prestige", ["makeup", "bodycare"], "medium", "Clean-positioned complexion and deodorant brand.", ["market-radar"]),
  brand("patrick-ta", "Patrick Ta", [], "Patrick Ta Beauty", "United States", "prestige", ["makeup"], "medium", "Prestige blush and complexion social-demand brand.", ["market-radar"]),
  brand("tarte", "Tarte", [], "Tarte Cosmetics", "United States", "prestige", ["makeup", "skincare"], "medium", "Concealer, blush and mascara demand brand.", ["market-radar"]),
  brand("anastasia-beverly-hills", "Anastasia Beverly Hills", ["ABH"], "Anastasia Beverly Hills", "United States", "prestige", ["makeup", "nails_lash_brow"], "high", "Brow, palette and complexion reference brand.", ["market-radar"]),
  brand("huda-beauty", "Huda Beauty", [], "Huda Beauty", "United Arab Emirates", "prestige", ["makeup", "fragrance"], "high", "Creator-led makeup and fragrance brand.", ["market-radar"]),
  brand("kylie-cosmetics", "Kylie Cosmetics", [], "Coty", "United States", "prestige", ["makeup", "skincare"], "medium", "Celebrity makeup and lip kit demand brand.", ["market-radar"]),
  brand("rimmel-london", "Rimmel London", ["Rimmel"], "Coty", "United Kingdom", "mass", ["makeup"], "medium", "Drugstore makeup listing candidate.", ["market-radar"]),
  brand("bourjois", "Bourjois", [], "Coty", "France", "mass", ["makeup"], "watch", "European drugstore makeup brand.", ["market-radar"]),
  brand("covergirl", "CoverGirl", [], "Coty", "United States", "mass", ["makeup"], "watch", "Drugstore makeup candidate.", ["market-radar"]),

  brand("romand", "rom&nd", ["Romand", "romand"], "iFamilySC", "South Korea", "masstige", ["makeup"], "seed-now", "K-beauty lip tint and color makeup anchor.", ["market-radar"]),
  brand("clio", "CLIO", ["Clio"], "Clio Cosmetics", "South Korea", "masstige", ["makeup"], "high", "K-beauty cushion, mascara and color makeup brand.", ["market-radar"]),
  brand("peripera", "Peripera", [], "Clio Cosmetics", "South Korea", "mass", ["makeup"], "high", "Affordable K-beauty lip tint anchor.", ["market-radar"]),
  brand("3ce", "3CE", ["3 Concept Eyes"], "L'Oreal Groupe", "South Korea", "prestige", ["makeup"], "medium", "K-beauty color makeup and lip product brand.", ["loreal-portfolio"]),
  brand("dasique", "Dasique", [], "WONDERLINE", "South Korea", "masstige", ["makeup"], "medium", "K-beauty palette and color makeup demand brand.", ["market-radar"]),
  brand("colorgram", "Colorgram", [], "Olive Young", "South Korea", "mass", ["makeup"], "watch", "Affordable K-beauty color makeup candidate.", ["market-radar"]),
  brand("hince", "hince", ["Hince"], "VIVAWAVE", "South Korea", "prestige", ["makeup"], "medium", "Minimal K-beauty makeup and lip color brand.", ["market-radar"]),
  brand("espoir", "Espoir", ["espoir"], "Amorepacific", "South Korea", "masstige", ["makeup"], "medium", "K-beauty base and color makeup brand.", ["amorepacific-portfolio"]),
  brand("banila-co", "Banila Co", ["Banila Co."], "F&F", "South Korea", "masstige", ["skincare", "makeup"], "high", "Cleansing balm and base makeup K-beauty brand.", ["market-radar"]),
  brand("heimish", "Heimish", [], "Heimish", "South Korea", "masstige", ["skincare", "makeup"], "medium", "Cleansing balm and sunscreen candidate.", ["market-radar"]),
  brand("beauty-of-joseon", "Beauty of Joseon", ["BOJ"], "Goodai Global", "South Korea", "masstige", ["skincare"], "seed-now", "K-beauty sunscreen and ginseng/rice skincare anchor.", ["market-radar"]),
  brand("isntree", "Isntree", [], "Isntree", "South Korea", "masstige", ["skincare"], "high", "K-beauty sunscreen, toner and barrier brand.", ["market-radar"]),
  brand("round-lab", "Round Lab", [], "Round Lab", "South Korea", "masstige", ["skincare"], "high", "K-beauty sunscreen and gentle skincare brand.", ["market-radar"]),
  brand("skin1004", "SKIN1004", ["Skin1004"], "SKIN1004", "South Korea", "masstige", ["skincare"], "high", "Centella and sunscreen K-beauty brand.", ["market-radar"]),
  brand("torriden", "Torriden", [], "Torriden", "South Korea", "masstige", ["skincare"], "medium", "Hydration serum and moisturizer K-beauty brand.", ["market-radar"]),
  brand("anua", "Anua", [], "The Founders", "South Korea", "masstige", ["skincare"], "high", "Toner and gentle skincare viral K-beauty brand.", ["market-radar"]),
  brand("medicube", "Medicube", [], "APR", "South Korea", "masstige", ["skincare", "beauty_tools_tech"], "high", "K-beauty skincare and beauty device brand.", ["market-radar"]),
  brand("abib", "Abib", [], "Four Company", "South Korea", "masstige", ["skincare"], "medium", "Mask, sunscreen and barrier skincare K-beauty brand.", ["market-radar"]),
  brand("some-by-mi", "Some By Mi", [], "Some By Mi", "South Korea", "masstige", ["skincare"], "medium", "Acne, AHA/BHA/PHA and bodycare K-beauty brand.", ["market-radar"]),
  brand("axis-y", "AXIS-Y", ["Axis Y"], "AXIS-Y", "South Korea", "masstige", ["skincare"], "medium", "Climate-aware K-beauty skincare and dark spot serum brand.", ["market-radar"]),

  brand("hada-labo", "Hada Labo", [], "Rohto Pharmaceutical", "Japan", "mass", ["skincare"], "seed-now", "J-beauty hyaluronic acid cleanser/lotion anchor.", ["market-radar"]),
  brand("melano-cc", "Melano CC", [], "Rohto Pharmaceutical", "Japan", "mass", ["skincare"], "seed-now", "Vitamin C and spot-care J-beauty anchor.", ["market-radar"]),
  brand("senka", "SENKA", ["Senka"], "Fine Today", "Japan", "mass", ["skincare"], "high", "Affordable J-beauty cleanser and sunscreen brand.", ["market-radar"]),
  brand("biore", "Biore", ["Bioré"], "Kao", "Japan", "mass", ["skincare", "bodycare"], "seed-now", "J-beauty sunscreen and cleansing anchor.", ["market-radar"]),
  brand("curel", "Curél", ["Curel"], "Kao", "Japan", "dermocosmetic", ["skincare", "bodycare"], "high", "Sensitive-skin ceramide J-beauty brand.", ["market-radar"]),
  brand("kanebo", "Kanebo", [], "Kao", "Japan", "prestige", ["skincare", "makeup"], "medium", "Prestige J-beauty skincare and makeup.", ["market-radar"]),
  brand("kate-tokyo", "KATE Tokyo", ["Kate"], "Kao", "Japan", "mass", ["makeup"], "medium", "J-beauty drugstore makeup candidate.", ["market-radar"]),
  brand("canmake", "Canmake", [], "IDA Laboratories", "Japan", "mass", ["makeup"], "high", "Affordable Japanese makeup and sunscreen brand.", ["market-radar"]),
  brand("cezanne", "Cezanne", [], "Cezanne", "Japan", "mass", ["makeup", "skincare"], "medium", "Affordable Japanese makeup brand.", ["market-radar"]),
  brand("d-up", "D-UP", ["DUP"], "D-UP", "Japan", "mass", ["makeup", "nails_lash_brow"], "medium", "Japanese eyeliner, mascara and lash product brand.", ["market-radar"]),
  brand("kiss-me-heroine-make", "Kiss Me Heroine Make", ["Heroine Make"], "Isehan", "Japan", "mass", ["makeup"], "high", "Japanese mascara and eyeliner anchor.", ["market-radar"]),
  brand("muji", "MUJI", [], "Ryohin Keikaku", "Japan", "mass", ["skincare", "bodycare"], "medium", "Minimal skincare and bodycare brand.", ["market-radar"]),
  brand("d-program", "d program", ["D Program"], "Shiseido Company", "Japan", "dermocosmetic", ["skincare"], "watch", "Sensitive-skin J-beauty derm brand.", ["shiseido-portfolio"]),

  brand("goodndoc", "GoodnDoc", ["GoodnDoc", "Goodn Doc"], "GoodnDoc", "South Korea", "masstige", ["skincare"], "seed-now", "Already in seed products; barrier serum listing anchor.", ["market-radar"]),
  brand("maycreate", "MayCreate", [], "MayCreate", "China", "mass", ["makeup", "skincare"], "watch", "Affordable marketplace brand to track carefully for source quality.", ["market-radar"]),
  brand("judydoll", "JudyDoll", ["Judy Doll"], "Joy Group", "China", "mass", ["makeup"], "medium", "C-beauty color makeup and contour candidate.", ["market-radar"]),
  brand("flortte", "Flortte", [], "Flortte", "China", "mass", ["makeup"], "medium", "C-beauty affordable color makeup candidate.", ["market-radar"]),
  brand("perfect-diary", "Perfect Diary", [], "Yatsen", "China", "mass", ["makeup", "skincare"], "medium", "C-beauty makeup brand with marketplace demand.", ["market-radar"]),
  brand("flower-knows", "Flower Knows", [], "Flower Knows", "China", "prestige", ["makeup"], "medium", "C-beauty decorative color makeup brand.", ["market-radar"]),
  brand("colorkey", "Colorkey", [], "Colorkey", "China", "mass", ["makeup"], "watch", "C-beauty lip and base makeup candidate.", ["market-radar"]),

  brand("lemonade", "Lemonade Cosmetics", ["Lemonade"], "Lemonade Cosmetics", "Vietnam", "local-vn", ["makeup", "skincare"], "seed-now", "Vietnamese makeup brand founded by a local beauty creator.", ["market-radar"]),
  brand("ofelia", "OFELIA", ["Ofélia", "Ofelia"], "OFELIA", "Vietnam", "local-vn", ["makeup"], "seed-now", "Vietnamese lip and color makeup brand with creator relevance.", ["market-radar"]),
  brand("cocoon", "Cocoon", ["Cocoon Vietnam"], "Cocoon", "Vietnam", "local-vn", ["skincare", "haircare", "bodycare"], "seed-now", "Vietnamese vegan skincare, haircare and bodycare anchor.", ["market-radar"]),
  brand("emmi-by-happy-skin", "Emmié by Happy Skin", ["Emmie", "Emmié"], "Happy Skin Vietnam", "Vietnam", "local-vn", ["skincare", "beauty_tools_tech"], "high", "Vietnamese skincare and beauty device brand tied to local education content.", ["market-radar"]),
  brand("laem-beauty", "Laem Beauty", ["LAEM"], "Laem Beauty", "Vietnam", "local-vn", ["makeup"], "medium", "Vietnamese celebrity-led makeup brand.", ["market-radar"]),
  brand("ty-cosmetics", "Ty Cosmetics", [], "Ty Cosmetics", "Vietnam", "local-vn", ["makeup"], "medium", "Vietnamese creator-linked makeup listing candidate.", ["market-radar"]),
  brand("candid", "Candid", [], "Skinetiq", "Vietnam", "local-vn", ["skincare"], "medium", "Vietnamese skincare brand connected to local beauty retail ecosystem.", ["market-radar"]),
  brand("skinetiq", "Skinetiq", [], "Skinetiq", "Vietnam", "local-vn", ["skincare"], "watch", "Local beauty group/brand ecosystem to track for listings.", ["market-radar"]),
]

export const BRAND_NAME_OPTIONS = BEAUTY_BRANDS.map((brand) => brand.name).sort((a, b) => a.localeCompare(b))

export const SEED_NOW_BRANDS = BEAUTY_BRANDS.filter((brand) => brand.listingPriority === "seed-now")

export function normalizeBrandName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function findBeautyBrand(value: string) {
  const normalized = normalizeBrandName(value)
  return BEAUTY_BRANDS.find((brand) => {
    if (brand.slug === normalized || normalizeBrandName(brand.name) === normalized) return true
    return brand.aliases?.some((alias) => normalizeBrandName(alias) === normalized)
  })
}

export function getBrandsByCategory(categoryKey: ProductCategoryKey) {
  return BEAUTY_BRANDS.filter((brand) => brand.categories.includes(categoryKey))
}

export function getListingSeedBrands(priority: BrandListingPriority[] = ["seed-now", "high"]) {
  return BEAUTY_BRANDS.filter((brand) => priority.includes(brand.listingPriority))
}

function brand(
  slug: string,
  name: string,
  aliases: string[],
  parentCompany: string,
  origin: string,
  segment: BeautyBrandSegment,
  categories: ProductCategoryKey[],
  listingPriority: BrandListingPriority,
  marketNotes: string,
  sourceIds: string[]
): BeautyBrand {
  return {
    slug,
    name,
    aliases: aliases.length > 0 ? aliases : undefined,
    parentCompany,
    origin,
    segment,
    categories,
    listingPriority,
    marketNotes,
    sourceIds,
  }
}

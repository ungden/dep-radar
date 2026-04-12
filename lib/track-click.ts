import { supabase } from '@/lib/supabase'

export async function trackAffiliateClick(productId: string) {
  await supabase.from('affiliate_clicks').insert({
    product_id: productId,
    referrer: typeof window !== 'undefined' ? window.location.pathname : null,
  })
}

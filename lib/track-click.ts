import { isSupabaseSchemaReady, supabase } from '@/lib/supabase'

export async function trackAffiliateClick(productId: string, offerId?: string) {
  if (!isSupabaseSchemaReady) return

  try {
    await supabase.from('affiliate_clicks').insert({
      product_id: productId,
      offer_id: offerId ?? null,
      referrer: typeof window !== 'undefined' ? window.location.pathname : null,
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
    })
  } catch {
    // Affiliate navigation should not be blocked by analytics.
  }
}

import { isSupabaseSchemaReady, supabase } from '@/lib/supabase'
import { trackEvent } from '@/lib/analytics'

export async function trackAffiliateClick(productId: string, offerId?: string) {
  const referrer = typeof window !== 'undefined' ? window.location.pathname : null
  trackEvent('verified_offer_clicked', {
    product_id: productId,
    offer_id: offerId,
    referrer,
  })

  if (!isSupabaseSchemaReady) return

  try {
    await supabase.from('affiliate_clicks').insert({
      product_id: productId,
      offer_id: offerId ?? null,
      referrer,
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
    })
  } catch {
    // Affiliate navigation should not be blocked by analytics.
  }
}

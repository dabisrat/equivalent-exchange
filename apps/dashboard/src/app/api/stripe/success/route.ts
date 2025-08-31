import { redirect } from 'next/navigation'
import { createClient } from '@eq-ex/shared/server'
import { syncStripeDataForCustomer } from '@eq-ex/shared/stripe'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect('/')

  const { data } = await supabase
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const customerId = data?.stripe_customer_id
  if (customerId) {
    await syncStripeDataForCustomer(customerId)
  }

  return redirect('/account/billing')
}



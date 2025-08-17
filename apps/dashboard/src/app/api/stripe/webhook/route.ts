import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe, syncStripeDataForCustomer } from '@eq-ex/shared/stripe'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('Stripe-Signature')
  if (!signature) return NextResponse.json({}, { status: 400 })

  const stripe = getStripe()
  let customerId: string | undefined
  try {
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    const obj = event.data?.object as { customer?: string } | undefined
    if (obj?.customer && typeof obj.customer === 'string') {
      customerId = obj.customer
    }
  } catch (err) {
    console.error('[STRIPE WEBHOOK] signature error', err)
    return NextResponse.json({}, { status: 400 })
  }

  try {
    if (customerId) {
      await syncStripeDataForCustomer(customerId)
    }
  } catch (err) {
    console.error('[STRIPE WEBHOOK] sync error', err)
  }

  return NextResponse.json({ received: true })
}



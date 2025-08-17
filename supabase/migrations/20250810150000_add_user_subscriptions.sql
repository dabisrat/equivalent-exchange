-- Create table to cache Stripe subscription status per user
create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  status text not null default 'none', -- 'none'|'active'|'trialing'|'past_due'|'canceled'|'incomplete' ...
  price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  payment_brand text,
  payment_last4 text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_user_subscriptions_status on public.user_subscriptions(status);



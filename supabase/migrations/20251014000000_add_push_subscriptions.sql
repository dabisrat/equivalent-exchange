-- Create push_subscriptions table for storing web push notification subscriptions
-- This table links users to their push subscriptions scoped by organization

create table public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add unique constraint to prevent duplicate subscriptions per user/organization
-- The subscription JSONB contains the endpoint, so we can use that for uniqueness
create unique index unique_user_org_endpoint on public.push_subscriptions
(user_id, organization_id, (subscription->>'endpoint'));

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Policy: Users can insert their own subscriptions
create policy "insert_own_subscription" on public.push_subscriptions
for insert to authenticated
with check (auth.uid() = user_id);

-- Policy: Users can update their own subscriptions
create policy "update_own_subscription" on public.push_subscriptions
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policy: Users can delete their own subscriptions
create policy "delete_own_subscription" on public.push_subscriptions
for delete to authenticated
using (auth.uid() = user_id);

-- Policy: Users can select their own subscriptions
create policy "select_own_subscription" on public.push_subscriptions
for select to authenticated
using (auth.uid() = user_id);

-- Create index for efficient queries
create index idx_push_subscriptions_user_org on public.push_subscriptions(user_id, organization_id);
create index idx_push_subscriptions_org_created on public.push_subscriptions(organization_id, created_at desc);

-- Add updated_at trigger using moddatetime extension
create trigger handle_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function moddatetime('updated_at');
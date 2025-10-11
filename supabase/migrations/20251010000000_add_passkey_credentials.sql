-- Create table for storing WebAuthn credentials (passkeys)
create table if not exists public.user_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id text unique not null,
  public_key text not null,
  counter bigint not null default 0,
  transports text[],
  device_name text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- Add index for faster lookups
create index if not exists user_credentials_user_id_idx on public.user_credentials(user_id);
create index if not exists user_credentials_credential_id_idx on public.user_credentials(credential_id);

-- Enable RLS
alter table public.user_credentials enable row level security;

-- RLS Policies: Users can only see and manage their own credentials
create policy "Users can view their own credentials"
  on public.user_credentials
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own credentials"
  on public.user_credentials
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own credentials"
  on public.user_credentials
  for delete
  using (auth.uid() = user_id);

create policy "Users can update their own credentials"
  on public.user_credentials
  for update
  using (auth.uid() = user_id);

-- Create table for storing active passkey challenges (temporary, for verification)
create table if not exists public.passkey_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  challenge text not null,
  type text not null check (type in ('registration', 'authentication')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes')
);

-- Add index for cleanup
create index if not exists passkey_challenges_expires_at_idx on public.passkey_challenges(expires_at);

-- Enable RLS
alter table public.passkey_challenges enable row level security;

-- RLS Policies: Users can only manage their own challenges
create policy "Users can view their own challenges"
  on public.passkey_challenges
  for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can insert their own challenges"
  on public.passkey_challenges
  for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can delete their own challenges"
  on public.passkey_challenges
  for delete
  using (auth.uid() = user_id or user_id is null);

-- Function to clean up expired challenges (run periodically)
create or replace function public.cleanup_expired_passkey_challenges()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.passkey_challenges
  where expires_at < now();
end;
$$;

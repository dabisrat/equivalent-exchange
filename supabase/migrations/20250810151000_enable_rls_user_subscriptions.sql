-- Enable RLS and restrict access to own row only. Server (service role) bypasses RLS.

alter table public.user_subscriptions enable row level security;

drop policy if exists "Read own subscription" on public.user_subscriptions;
create policy "Read own subscription"
on public.user_subscriptions
for select
to authenticated
using (user_id = auth.uid());

-- No insert/update/delete policies: clients cannot write. Server code uses service role and bypasses RLS.



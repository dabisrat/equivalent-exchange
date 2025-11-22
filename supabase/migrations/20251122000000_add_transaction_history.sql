create table "public"."transaction_history" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "organization_id" uuid not null,
    "user_id" uuid not null,
    "card_id" uuid not null,
    "stamper_id" uuid,
    "action_type" text not null,
    "metadata" jsonb
);

alter table "public"."transaction_history" enable row level security;

CREATE UNIQUE INDEX transaction_history_pkey ON public.transaction_history USING btree (id);

alter table "public"."transaction_history" add constraint "transaction_history_pkey" PRIMARY KEY using index "transaction_history_pkey";

alter table "public"."transaction_history" add constraint "transaction_history_card_id_fkey" FOREIGN KEY (card_id) REFERENCES reward_card(id) ON DELETE CASCADE not valid;

alter table "public"."transaction_history" validate constraint "transaction_history_card_id_fkey";

alter table "public"."transaction_history" add constraint "transaction_history_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE not valid;

alter table "public"."transaction_history" validate constraint "transaction_history_organization_id_fkey";

alter table "public"."transaction_history" add constraint "transaction_history_stamper_id_fkey" FOREIGN KEY (stamper_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."transaction_history" validate constraint "transaction_history_stamper_id_fkey";

alter table "public"."transaction_history" add constraint "transaction_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."transaction_history" validate constraint "transaction_history_user_id_fkey";

create policy "Enable read access for organization members"
on "public"."transaction_history"
as permissive
for select
to public
using (
  (EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = transaction_history.organization_id) AND (organization_members.user_id = (SELECT auth.uid())) AND (organization_members.is_active = true))))
);

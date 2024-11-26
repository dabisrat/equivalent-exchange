create extension if not exists "moddatetime" with schema "public" version '1.0';

alter table
   "public"."stamp" drop constraint "stamp_id_key";

alter table
   "public"."stamp" drop constraint "stamp_reward_card_id_key";

alter table
   "public"."stamp" drop constraint "stamp_pkey";

alter table
   "public"."stamper" drop constraint "stamper_pkey";

drop index if exists "public"."stamp_id_key";

drop index if exists "public"."stamp_reward_card_id_key";

drop index if exists "public"."stamp_pkey";

drop index if exists "public"."stamper_pkey";

alter table
   "public"."stamp" drop column "id";

alter table
   "public"."stamp"
add
   column "stamp_index" bigint not null default '0' :: bigint;

alter table
   "public"."stamp"
add
   column "updated_at" timestamp with time zone default now();

alter table
   "public"."stamp"
alter column
   "stamped"
set
   default true;

alter table
   "public"."stamp"
alter column
   "stamper_id"
set
   default auth.uid();

alter table
   "public"."stamp"
alter column
   "stamper_id" drop not null;

alter table
   "public"."stamp"
alter column
   "stamper_id"
set
   data type uuid using "stamper_id" :: uuid;

alter table
   "public"."stamper" drop column "id";

alter table
   "public"."stamper"
alter column
   "organization_id"
set
   not null;

alter table
   "public"."stamper"
alter column
   "user_id"
set
   not null;

CREATE UNIQUE INDEX stamp_pkey ON public.stamp USING btree (reward_card_id, stamp_index);

CREATE UNIQUE INDEX stamper_pkey ON public.stamper USING btree (organization_id, user_id);

alter table
   "public"."stamp"
add
   constraint "stamp_pkey" PRIMARY KEY using index "stamp_pkey";

alter table
   "public"."stamper"
add
   constraint "stamper_pkey" PRIMARY KEY using index "stamper_pkey";

alter table
   "public"."stamp"
add
   constraint "stamp_stamp_index_check" CHECK ((stamp_index >= 0)) not valid;

alter table
   "public"."stamp" validate constraint "stamp_stamp_index_check";

alter table
   "public"."stamp"
add
   constraint "stamp_stamper_id_fkey" FOREIGN KEY (stamper_id) REFERENCES auth.users(id) ON UPDATE CASCADE not valid;

alter table
   "public"."stamp" validate constraint "stamp_stamper_id_fkey";

create policy "allow authorized users to add to the stamp table" on "public"."stamp" as permissive for
insert
   to authenticated with check (
      (
         EXISTS (
            SELECT
               1
            FROM
               stamper
            WHERE
               (
                  (
                     stamper.organization_id = (
                        SELECT
                           reward_card.organization_id
                        FROM
                           reward_card
                        WHERE
                           (reward_card.id = stamp.reward_card_id)
                     )
                  )
                  AND (stamper.user_id = auth.uid())
               )
         )
      )
   );

create policy "read from the stamps table if authenticated" on "public"."stamp" as permissive for
select
   to authenticated using (true);

create policy "update stamps table for authenticated and authorized user" on "public"."stamp" as permissive for
update
   to authenticated using (
      (
         EXISTS (
            SELECT
               1
            FROM
               stamper
            WHERE
               (
                  (
                     stamper.organization_id = (
                        SELECT
                           reward_card.organization_id
                        FROM
                           reward_card
                        WHERE
                           (reward_card.id = stamp.reward_card_id)
                     )
                  )
                  AND (stamper.user_id = auth.uid())
               )
         )
      )
   ) with check (
      (
         EXISTS (
            SELECT
               1
            FROM
               stamper
            WHERE
               (
                  (
                     stamper.organization_id = (
                        SELECT
                           reward_card.organization_id
                        FROM
                           reward_card
                        WHERE
                           (reward_card.id = stamp.reward_card_id)
                     )
                  )
                  AND (stamper.user_id = auth.uid())
               )
         )
      )
   );

CREATE TRIGGER handle_updated_at BEFORE
UPDATE
   ON public.stamp FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');
alter table "public"."stamp" add constraint "public_stamp_stamper_id_fkey" FOREIGN KEY (stamper_id) REFERENCES stamper(id) not valid;

alter table "public"."stamp" validate constraint "public_stamp_stamper_id_fkey";



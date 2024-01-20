
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA IF NOT EXISTS "next_auth";

ALTER SCHEMA "next_auth" OWNER TO "postgres";

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

CREATE SCHEMA IF NOT EXISTS "supabase_migrations";

ALTER SCHEMA "supabase_migrations" OWNER TO "postgres";

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE OR REPLACE FUNCTION "next_auth"."uid"() RETURNS uuid
    LANGUAGE "sql" STABLE
    AS $$
  select
    coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;

ALTER FUNCTION "next_auth"."uid"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "next_auth"."accounts" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "type" text NOT NULL,
    "provider" text NOT NULL,
    "providerAccountId" text NOT NULL,
    "refresh_token" text,
    "access_token" text,
    "expires_at" bigint,
    "token_type" text,
    "scope" text,
    "id_token" text,
    "session_state" text,
    "oauth_token_secret" text,
    "oauth_token" text,
    "userId" uuid
);

ALTER TABLE "next_auth"."accounts" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "next_auth"."sessions" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "expires" timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid
);

ALTER TABLE "next_auth"."sessions" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "next_auth"."users" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text,
    "email" text,
    "emailVerified" timestamp with time zone,
    "image" text
);

ALTER TABLE "next_auth"."users" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "next_auth"."verification_tokens" (
    "identifier" text,
    "token" text NOT NULL,
    "expires" timestamp with time zone NOT NULL
);

ALTER TABLE "next_auth"."verification_tokens" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."organization" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "organization_name" character varying,
    "email" character varying
);

ALTER TABLE "public"."organization" OWNER TO "postgres";

ALTER TABLE "public"."organization" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."organization_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."reward_card" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "points" bigint DEFAULT '0'::bigint NOT NULL,
    "organization_id" bigint NOT NULL,
    "user_id" uuid
);

ALTER TABLE "public"."reward_card" OWNER TO "postgres";

ALTER TABLE "public"."reward_card" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."reward_card_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."stamp" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "stamper_id" bigint NOT NULL,
    "reward_card_id" bigint,
    "stamped" boolean
);

ALTER TABLE "public"."stamp" OWNER TO "postgres";

ALTER TABLE "public"."stamp" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."stamp_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."stamper" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "name" character varying,
    "email" character varying,
    "organization_id" bigint,
    "user_id" uuid
);

ALTER TABLE "public"."stamper" OWNER TO "postgres";

ALTER TABLE "public"."stamper" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."stamper_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "supabase_migrations"."schema_migrations" (
    "version" text NOT NULL,
    "statements" text[],
    "name" text
);

ALTER TABLE "supabase_migrations"."schema_migrations" OWNER TO "postgres";

ALTER TABLE ONLY "next_auth"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "next_auth"."users"
    ADD CONSTRAINT "email_unique" UNIQUE ("email");

ALTER TABLE ONLY "next_auth"."accounts"
    ADD CONSTRAINT "provider_unique" UNIQUE ("provider", "providerAccountId");

ALTER TABLE ONLY "next_auth"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "next_auth"."sessions"
    ADD CONSTRAINT "sessiontoken_unique" UNIQUE ("sessionToken");

ALTER TABLE ONLY "next_auth"."verification_tokens"
    ADD CONSTRAINT "token_identifier_unique" UNIQUE ("token", "identifier");

ALTER TABLE ONLY "next_auth"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "next_auth"."verification_tokens"
    ADD CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("token");

ALTER TABLE ONLY "public"."organization"
    ADD CONSTRAINT "organization_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."reward_card"
    ADD CONSTRAINT "reward_card_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."stamp"
    ADD CONSTRAINT "stamp_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."stamper"
    ADD CONSTRAINT "stamper_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "supabase_migrations"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");

ALTER TABLE ONLY "next_auth"."accounts"
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY "next_auth"."sessions"
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."reward_card"
    ADD CONSTRAINT "reward_card_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organization(id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."reward_card"
    ADD CONSTRAINT "reward_card_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."stamp"
    ADD CONSTRAINT "stamp_reward_card_id_fkey" FOREIGN KEY (reward_card_id) REFERENCES public.reward_card(id);

ALTER TABLE ONLY "public"."stamp"
    ADD CONSTRAINT "stamp_stamper_id_fkey" FOREIGN KEY (stamper_id) REFERENCES public.stamper(id);

ALTER TABLE ONLY "public"."stamper"
    ADD CONSTRAINT "stamper_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organization(id) ON UPDATE RESTRICT ON DELETE CASCADE;

ALTER TABLE ONLY "public"."stamper"
    ADD CONSTRAINT "stamper_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."reward_card" FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."reward_card" FOR SELECT USING (true);

CREATE POLICY "Enable reads to stamper table for authenticated users only" ON "public"."stamper" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable update for users based on email" ON "public"."reward_card" FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.stamper
  WHERE ((stamper.organization_id = reward_card.organization_id) AND (stamper.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.stamper
  WHERE ((stamper.organization_id = reward_card.organization_id) AND (stamper.user_id = auth.uid())))));

ALTER TABLE "public"."organization" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."reward_card" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."stamp" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."stamper" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "next_auth" TO "service_role";

REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON TABLE "next_auth"."accounts" TO "service_role";

GRANT ALL ON TABLE "next_auth"."sessions" TO "service_role";

GRANT ALL ON TABLE "next_auth"."users" TO "service_role";

GRANT ALL ON TABLE "next_auth"."verification_tokens" TO "service_role";

GRANT ALL ON TABLE "public"."organization" TO "anon";
GRANT ALL ON TABLE "public"."organization" TO "authenticated";
GRANT ALL ON TABLE "public"."organization" TO "service_role";

GRANT ALL ON SEQUENCE "public"."organization_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."organization_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."organization_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."reward_card" TO "anon";
GRANT ALL ON TABLE "public"."reward_card" TO "authenticated";
GRANT ALL ON TABLE "public"."reward_card" TO "service_role";

GRANT ALL ON SEQUENCE "public"."reward_card_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reward_card_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reward_card_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."stamp" TO "anon";
GRANT ALL ON TABLE "public"."stamp" TO "authenticated";
GRANT ALL ON TABLE "public"."stamp" TO "service_role";

GRANT ALL ON SEQUENCE "public"."stamp_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stamp_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stamp_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."stamper" TO "anon";
GRANT ALL ON TABLE "public"."stamper" TO "authenticated";
GRANT ALL ON TABLE "public"."stamper" TO "service_role";

GRANT ALL ON SEQUENCE "public"."stamper_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stamper_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stamper_id_seq" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;

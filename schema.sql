


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."normalize_vehicle_and_driver_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if tg_table_name = 'vehicles' then
    new.plate_number := upper(regexp_replace(trim(coalesce(new.plate_number, '')), '\s+', '', 'g'));
    new.plate_number_normalized := new.plate_number;
    return new;
  end if;

  if tg_table_name = 'drivers' then
    new.phone_normalized := regexp_replace(coalesce(new.phone, ''), '\D', '', 'g');
    return new;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."normalize_vehicle_and_driver_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_user_profiles_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_code" "text" NOT NULL,
    "group_name" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "vehicle_assigned" "text",
    "driver_assigned" "text",
    "quotation_pdf_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "booking_id" "uuid",
    "vehicle_type" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "vehicle_id" "uuid",
    "driver_id" "uuid",
    "start_datetime" timestamp with time zone,
    "end_datetime" timestamp with time zone,
    CONSTRAINT "assignments_vehicle_type_check" CHECK (("vehicle_type" = ANY (ARRAY['5'::"text", '7'::"text", '9'::"text", '16'::"text", '29'::"text", '45'::"text"])))
);


ALTER TABLE "public"."assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_code" "text" NOT NULL,
    "group_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "passenger_count" integer DEFAULT 0 NOT NULL,
    "vehicle_type" "text",
    "start_date" "date",
    "end_date" "date",
    "pickup_location" "text",
    "dropoff_location" "text",
    "unit_price" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_km" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_extra" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "booking_source" "text" DEFAULT 'direct'::"text" NOT NULL,
    "partner_company_id" "uuid",
    "has_partner_company" boolean DEFAULT false NOT NULL,
    "partner_company_name" "text",
    "partner_contact_name" "text",
    "partner_phone" "text",
    "partner_email" "text",
    "partner_notes" "text",
    CONSTRAINT "bookings_vehicle_type_check" CHECK (("vehicle_type" = ANY (ARRAY['5'::"text", '7'::"text", '9'::"text", '16'::"text", '29'::"text", '45'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drivers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "phone_normalized" "text"
);


ALTER TABLE "public"."drivers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."itinerary_legs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "seq_no" integer NOT NULL,
    "trip_date" "date",
    "itinerary" "text",
    "distance_km" numeric(12,2) DEFAULT 0 NOT NULL,
    "note" "text",
    "extra_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pickup_time" time without time zone,
    "dropoff_time" time without time zone
);


ALTER TABLE "public"."itinerary_legs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" "text" NOT NULL,
    "contact_name" "text",
    "phone" "text",
    "email" "text",
    "address" "text",
    "tax_code" "text",
    "notes" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."partner_companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "booking_code" "text" NOT NULL,
    "pdf_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "total_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quotations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."service_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_package_legs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_package_id" "uuid" NOT NULL,
    "seq_no" integer NOT NULL,
    "day_no" integer NOT NULL,
    "pickup_time" "text",
    "dropoff_time" "text",
    "itinerary" "text" NOT NULL,
    "distance_km" numeric DEFAULT 0 NOT NULL,
    "note" "text",
    "extra_amount" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."service_package_legs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "duration_days" integer,
    "vehicle_type" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "source_url" "text",
    "source_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."service_packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'manager'::"text", 'sales'::"text", 'operator'::"text", 'accountant'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plate_number" "text" NOT NULL,
    "vehicle_name" "text",
    "seat_count" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "plate_number_normalized" "text"
);


ALTER TABLE "public"."vehicles" OWNER TO "postgres";


ALTER TABLE "public"."assignments"
    ADD CONSTRAINT "assignments_datetime_range_check" CHECK ((("start_datetime" IS NULL) OR ("end_datetime" IS NULL) OR ("start_datetime" <= "end_datetime"))) NOT VALID;



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_booking_code_key" UNIQUE ("booking_code");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drivers"
    ADD CONSTRAINT "drivers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."itinerary_legs"
    ADD CONSTRAINT "itinerary_legs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_companies"
    ADD CONSTRAINT "partner_companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_categories"
    ADD CONSTRAINT "service_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."service_categories"
    ADD CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_package_legs"
    ADD CONSTRAINT "service_package_legs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_packages"
    ADD CONSTRAINT "service_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_plate_number_key" UNIQUE ("plate_number");



CREATE UNIQUE INDEX "drivers_phone_normalized_uidx" ON "public"."drivers" USING "btree" ("phone_normalized") WHERE (("phone_normalized" IS NOT NULL) AND ("phone_normalized" <> ''::"text"));



CREATE UNIQUE INDEX "drivers_phone_unique_idx" ON "public"."drivers" USING "btree" ("regexp_replace"(TRIM(BOTH FROM "phone"), '\D'::"text", ''::"text", 'g'::"text"));



CREATE INDEX "idx_assignments_booking_id" ON "public"."assignments" USING "btree" ("booking_id");



CREATE INDEX "idx_assignments_driver_datetime" ON "public"."assignments" USING "btree" ("driver_id", "start_datetime", "end_datetime");



CREATE INDEX "idx_assignments_driver_id" ON "public"."assignments" USING "btree" ("driver_id");



CREATE INDEX "idx_assignments_end_datetime" ON "public"."assignments" USING "btree" ("end_datetime");



CREATE INDEX "idx_assignments_start_datetime" ON "public"."assignments" USING "btree" ("start_datetime");



CREATE INDEX "idx_assignments_status" ON "public"."assignments" USING "btree" ("status");



CREATE INDEX "idx_assignments_vehicle_datetime" ON "public"."assignments" USING "btree" ("vehicle_id", "start_datetime", "end_datetime");



CREATE INDEX "idx_assignments_vehicle_id" ON "public"."assignments" USING "btree" ("vehicle_id");



CREATE INDEX "idx_bookings_booking_source" ON "public"."bookings" USING "btree" ("booking_source");



CREATE INDEX "idx_bookings_created_at" ON "public"."bookings" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_bookings_end_date" ON "public"."bookings" USING "btree" ("end_date");



CREATE INDEX "idx_bookings_partner_company_id" ON "public"."bookings" USING "btree" ("partner_company_id");



CREATE INDEX "idx_bookings_start_date" ON "public"."bookings" USING "btree" ("start_date");



CREATE INDEX "idx_itinerary_legs_booking_id" ON "public"."itinerary_legs" USING "btree" ("booking_id");



CREATE INDEX "idx_partner_companies_company_name" ON "public"."partner_companies" USING "btree" ("company_name");



CREATE INDEX "idx_quotations_booking_id" ON "public"."quotations" USING "btree" ("booking_id");



CREATE INDEX "idx_service_package_legs_package_id" ON "public"."service_package_legs" USING "btree" ("service_package_id");



CREATE UNIQUE INDEX "idx_service_package_legs_unique_seq" ON "public"."service_package_legs" USING "btree" ("service_package_id", "seq_no");



CREATE INDEX "idx_service_packages_category" ON "public"."service_packages" USING "btree" ("category");



CREATE UNIQUE INDEX "vehicles_plate_number_normalized_uidx" ON "public"."vehicles" USING "btree" ("plate_number_normalized");



CREATE UNIQUE INDEX "vehicles_plate_number_unique_idx" ON "public"."vehicles" USING "btree" ("upper"("regexp_replace"(TRIM(BOTH FROM "plate_number"), '\s+'::"text", ''::"text", 'g'::"text")));



CREATE OR REPLACE TRIGGER "trg_normalize_drivers" BEFORE INSERT OR UPDATE ON "public"."drivers" FOR EACH ROW EXECUTE FUNCTION "public"."normalize_vehicle_and_driver_fields"();



CREATE OR REPLACE TRIGGER "trg_normalize_vehicles" BEFORE INSERT OR UPDATE ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION "public"."normalize_vehicle_and_driver_fields"();



CREATE OR REPLACE TRIGGER "trg_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_user_profiles_updated_at"();



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."itinerary_legs"
    ADD CONSTRAINT "itinerary_legs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_package_legs"
    ADD CONSTRAINT "service_package_legs_service_package_id_fkey" FOREIGN KEY ("service_package_id") REFERENCES "public"."service_packages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drivers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."itinerary_legs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_package_legs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_profiles_select_own" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."assignments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."bookings";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."normalize_vehicle_and_driver_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_vehicle_and_driver_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_vehicle_and_driver_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_profiles_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."assignments" TO "anon";
GRANT ALL ON TABLE "public"."assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."assignments" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."drivers" TO "anon";
GRANT ALL ON TABLE "public"."drivers" TO "authenticated";
GRANT ALL ON TABLE "public"."drivers" TO "service_role";



GRANT ALL ON TABLE "public"."itinerary_legs" TO "anon";
GRANT ALL ON TABLE "public"."itinerary_legs" TO "authenticated";
GRANT ALL ON TABLE "public"."itinerary_legs" TO "service_role";



GRANT ALL ON TABLE "public"."partner_companies" TO "anon";
GRANT ALL ON TABLE "public"."partner_companies" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_companies" TO "service_role";



GRANT ALL ON TABLE "public"."quotations" TO "anon";
GRANT ALL ON TABLE "public"."quotations" TO "authenticated";
GRANT ALL ON TABLE "public"."quotations" TO "service_role";



GRANT ALL ON TABLE "public"."service_categories" TO "anon";
GRANT ALL ON TABLE "public"."service_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."service_categories" TO "service_role";



GRANT ALL ON TABLE "public"."service_package_legs" TO "anon";
GRANT ALL ON TABLE "public"."service_package_legs" TO "authenticated";
GRANT ALL ON TABLE "public"."service_package_legs" TO "service_role";



GRANT ALL ON TABLE "public"."service_packages" TO "anon";
GRANT ALL ON TABLE "public"."service_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."service_packages" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles" TO "anon";
GRANT ALL ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































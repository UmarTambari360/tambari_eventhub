CREATE TYPE "public"."role" AS ENUM('attendee', 'organizer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."organizer_status" AS ENUM('pending', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."transaction_provider" AS ENUM('paystack');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'success', 'failed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."webhook_status" AS ENUM('received', 'processing', 'processed', 'failed', 'ignored');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"phone_number" text,
	"avatar_url" text,
	"avatar_public_id" text,
	"role" "role" DEFAULT 'attendee' NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"suspended_at" timestamp with time zone,
	"suspended_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"family" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizer_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" text NOT NULL,
	"business_description" text NOT NULL,
	"website_url" text,
	"instagram_handle" text,
	"bank_name" text NOT NULL,
	"bank_code" text NOT NULL,
	"bank_account_number" text NOT NULL,
	"bank_account_name" text NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" text NOT NULL,
	"business_description" text,
	"website_url" text,
	"instagram_handle" text,
	"paystack_subaccount_code" text,
	"paystack_subaccount_id" text,
	"bank_name" text,
	"bank_account_number" text,
	"bank_account_name" text,
	"status" "organizer_status" DEFAULT 'pending' NOT NULL,
	"total_events_created" integer DEFAULT 0 NOT NULL,
	"total_tickets_sold" integer DEFAULT 0 NOT NULL,
	"total_revenue" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizer_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "organizer_profiles_paystack_subaccount_code_unique" UNIQUE("paystack_subaccount_code")
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"slug" text NOT NULL,
	"organizer_id" uuid NOT NULL,
	"venue" text NOT NULL,
	"location" text NOT NULL,
	"address" text,
	"event_date" timestamp with time zone NOT NULL,
	"event_end_date" timestamp with time zone,
	"banner_image_url" text,
	"banner_public_id" text,
	"thumbnail_url" text,
	"thumbnail_public_id" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"feature_order" integer,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"total_capacity" integer,
	"category" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ticket_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"quantity_sold" integer DEFAULT 0 NOT NULL,
	"sale_start_date" timestamp with time zone,
	"sale_end_date" timestamp with time zone,
	"min_purchase" integer DEFAULT 1 NOT NULL,
	"max_purchase" integer DEFAULT 10 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"subtotal" integer NOT NULL,
	"service_fee" integer DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"is_free_order" boolean DEFAULT false NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"expires_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"ticket_type_id" uuid NOT NULL,
	"ticket_type_name" text NOT NULL,
	"price_per_ticket" integer NOT NULL,
	"quantity" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"ticket_type_id" uuid NOT NULL,
	"ticket_code" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text,
	"is_checked_in" boolean DEFAULT false NOT NULL,
	"checked_in_at" timestamp with time zone,
	"checked_in_by" uuid,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_reason" text,
	"qr_code_url" text,
	"qr_code_public_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendees_ticket_code_unique" UNIQUE("ticket_code")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" "transaction_provider" DEFAULT 'paystack' NOT NULL,
	"amount" integer NOT NULL,
	"platform_fee" integer NOT NULL,
	"organizer_amount" integer NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"email" text NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"split_code" text,
	"subaccount_code" text,
	"paystack_reference" text,
	"access_code" text,
	"authorization_url" text,
	"channel" text,
	"card_type" text,
	"bank" text,
	"last_four_digits" text,
	"paystack_response" jsonb,
	"gateway_response" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"webhook_received" boolean DEFAULT false NOT NULL,
	"webhook_received_at" timestamp with time zone,
	"webhook_attempts" integer DEFAULT 0 NOT NULL,
	"failure_reason" text,
	"ip_address" text,
	"is_refunded" boolean DEFAULT false NOT NULL,
	"refunded_at" timestamp with time zone,
	"paystack_refund_id" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "platform_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"organizer_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"gross_amount" integer NOT NULL,
	"platform_fee" integer NOT NULL,
	"organizer_net" integer NOT NULL,
	"fee_percent" numeric(5, 2) NOT NULL,
	"is_reversed" boolean DEFAULT false NOT NULL,
	"reversed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_ledger_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event" text NOT NULL,
	"payload" jsonb NOT NULL,
	"headers" jsonb,
	"reference" text,
	"signature" text,
	"is_signature_valid" boolean DEFAULT false NOT NULL,
	"status" "webhook_status" DEFAULT 'received' NOT NULL,
	"processed_at" timestamp with time zone,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"is_processed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizer_applications" ADD CONSTRAINT "organizer_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizer_applications" ADD CONSTRAINT "organizer_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizer_profiles" ADD CONSTRAINT "organizer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_ticket_type_id_ticket_types_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_ticket_type_id_ticket_types_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_ledger" ADD CONSTRAINT "platform_ledger_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_ledger" ADD CONSTRAINT "platform_ledger_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_ledger" ADD CONSTRAINT "platform_ledger_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_ledger" ADD CONSTRAINT "platform_ledger_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_users_suspended" ON "users" USING btree ("is_suspended") WHERE is_suspended = true;--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_family" ON "refresh_tokens" USING btree ("family");--> statement-breakpoint
CREATE INDEX "idx_organizer_applications_status" ON "organizer_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_organizer_applications_user" ON "organizer_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_organizer_profiles_user" ON "organizer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_organizer_profiles_subaccount" ON "organizer_profiles" USING btree ("paystack_subaccount_code");--> statement-breakpoint
CREATE INDEX "idx_events_organizer" ON "events" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "idx_events_slug" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_events_date" ON "events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "idx_events_published" ON "events" USING btree ("is_published") WHERE is_published = true;--> statement-breakpoint
CREATE INDEX "idx_events_featured" ON "events" USING btree ("is_featured","feature_order") WHERE is_featured = true;--> statement-breakpoint
CREATE INDEX "idx_events_category" ON "events" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_ticket_types_event" ON "ticket_types" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_orders_user" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orders_event" ON "orders" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_number" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_ticket_type" ON "order_items" USING btree ("ticket_type_id");--> statement-breakpoint
CREATE INDEX "idx_attendees_ticket_code" ON "attendees" USING btree ("ticket_code");--> statement-breakpoint
CREATE INDEX "idx_attendees_event" ON "attendees" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_attendees_order" ON "attendees" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_reference" ON "transactions" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "idx_transactions_order" ON "transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_platform_ledger_organizer" ON "platform_ledger" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "idx_platform_ledger_event" ON "platform_ledger" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_platform_ledger_created" ON "platform_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_logs_reference" ON "webhook_logs" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "idx_webhook_logs_is_processed" ON "webhook_logs" USING btree ("is_processed");
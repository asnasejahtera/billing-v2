CREATE TABLE "routers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "routers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"host" varchar(255) NOT NULL,
	"port" integer DEFAULT 8728 NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_encrypted" varchar(1000) NOT NULL,
	"use_https" boolean DEFAULT false NOT NULL,
	"description" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "routers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE INDEX "routers_host_idx" ON "routers" USING btree ("host");--> statement-breakpoint
CREATE INDEX "routers_is_active_idx" ON "routers" USING btree ("is_active");
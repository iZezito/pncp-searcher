CREATE TYPE "public"."UserRole" AS ENUM('DEFAULT', 'ADMIN');--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"verificationToken" text NOT NULL,
	"expiryDate" timestamp (3) with time zone NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itens" (
	"id" text PRIMARY KEY NOT NULL,
	"planilhaId" text NOT NULL,
	"numero" integer NOT NULL,
	"descricao" text NOT NULL,
	"quantidade" integer NOT NULL,
	"unidade" text NOT NULL,
	"valor" real NOT NULL,
	"fonte" text NOT NULL,
	"createdAt" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"expiryDate" timestamp (3) with time zone NOT NULL,
	"userId" text
);
--> statement-breakpoint
CREATE TABLE "planilhas" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "two_factor_authentication" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"expiryDate" timestamp (3) with time zone NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "UserRole" DEFAULT 'DEFAULT' NOT NULL,
	"password" text NOT NULL,
	"oauth2Provider" text,
	"emailVerified" boolean DEFAULT false,
	"twoFactorAuthenticationEnabled" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "itens" ADD CONSTRAINT "itens_planilhaId_fkey" FOREIGN KEY ("planilhaId") REFERENCES "public"."planilhas"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "planilhas" ADD CONSTRAINT "planilhas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "two_factor_authentication" ADD CONSTRAINT "two_factor_authentication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "email_verifications_userId_key" ON "email_verifications" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "email_verifications_verificationToken_key" ON "email_verifications" USING btree ("verificationToken" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_tokens_userId_key" ON "password_reset_tokens" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "two_factor_authentication_userId_key" ON "two_factor_authentication" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email" text_ops);
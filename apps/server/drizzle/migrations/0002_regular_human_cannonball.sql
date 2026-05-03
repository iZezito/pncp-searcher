CREATE TABLE "itens_busca" (
	"id" text PRIMARY KEY NOT NULL,
	"descricao" text NOT NULL,
	"valor" double precision NOT NULL,
	"unidadeMedida" text NOT NULL,
	"link" text NOT NULL,
	"fonte" text NOT NULL,
	"paginaInterna" integer NOT NULL,
	"paginaExterna" integer NOT NULL,
	"itemId" text,
	"userId" text NOT NULL,
	"createdAt" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "itens" ALTER COLUMN "valor" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "itens" ADD COLUMN "link" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "itens_busca" ADD CONSTRAINT "itens_busca_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."itens"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "itens_busca" ADD CONSTRAINT "itens_busca_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;
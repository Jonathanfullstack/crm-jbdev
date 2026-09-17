-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Proposta';
ALTER TABLE "Proposal" ADD COLUMN "items" JSONB;

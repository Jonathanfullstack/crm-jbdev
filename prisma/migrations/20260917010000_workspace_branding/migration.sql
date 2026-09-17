-- CreateEnum
CREATE TYPE "WorkspaceTheme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "slug" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "faviconUrl" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "secondaryColor" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "theme" "WorkspaceTheme" NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE "Workspace" ADD COLUMN "showDeveloperCredit" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

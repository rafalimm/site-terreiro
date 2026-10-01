ALTER TABLE "users" ADD COLUMN "degreeId" TEXT;

CREATE TABLE "filho_degrees" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  CONSTRAINT "filho_degrees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "filho_content_modules" (
  "id" TEXT NOT NULL,
  "degreeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  CONSTRAINT "filho_content_modules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "filho_contents" (
  "id" TEXT NOT NULL,
  "degreeId" TEXT NOT NULL,
  "moduleId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "mediaUrl" TEXT,
  "coverUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  CONSTRAINT "filho_contents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "filho_content_progress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TEXT,
  CONSTRAINT "filho_content_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "filho_content_progress_userId_contentId_key" ON "filho_content_progress"("userId","contentId");
CREATE INDEX "filho_degrees_sortOrder_idx" ON "filho_degrees"("sortOrder");
CREATE INDEX "filho_content_modules_degreeId_sortOrder_idx" ON "filho_content_modules"("degreeId","sortOrder");
CREATE INDEX "filho_contents_degreeId_sortOrder_idx" ON "filho_contents"("degreeId","sortOrder");
CREATE INDEX "filho_contents_moduleId_sortOrder_idx" ON "filho_contents"("moduleId","sortOrder");
CREATE INDEX "filho_content_progress_userId_idx" ON "filho_content_progress"("userId");
CREATE INDEX "filho_content_progress_contentId_idx" ON "filho_content_progress"("contentId");

ALTER TABLE "users" ADD CONSTRAINT "users_degreeId_fkey" FOREIGN KEY ("degreeId") REFERENCES "filho_degrees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "filho_content_modules" ADD CONSTRAINT "filho_content_modules_degreeId_fkey" FOREIGN KEY ("degreeId") REFERENCES "filho_degrees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "filho_contents" ADD CONSTRAINT "filho_contents_degreeId_fkey" FOREIGN KEY ("degreeId") REFERENCES "filho_degrees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "filho_contents" ADD CONSTRAINT "filho_contents_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "filho_content_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "filho_content_progress" ADD CONSTRAINT "filho_content_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "filho_content_progress" ADD CONSTRAINT "filho_content_progress_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "filho_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

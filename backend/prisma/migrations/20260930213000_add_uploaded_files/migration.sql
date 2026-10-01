CREATE TABLE "uploaded_files" (
  "id" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "uploaded_files_createdAt_idx" ON "uploaded_files"("createdAt");

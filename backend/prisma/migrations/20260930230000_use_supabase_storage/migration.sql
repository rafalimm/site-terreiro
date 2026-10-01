ALTER TABLE "uploaded_files"
  ALTER COLUMN "data" DROP NOT NULL;

ALTER TABLE "uploaded_files"
  ADD COLUMN "storagePath" TEXT;

CREATE INDEX "uploaded_files_storagePath_idx" ON "uploaded_files"("storagePath");

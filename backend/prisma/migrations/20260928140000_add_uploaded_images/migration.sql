CREATE TABLE "uploaded_images" (
  "id" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "createdAt" TEXT NOT NULL,
  CONSTRAINT "uploaded_images_pkey" PRIMARY KEY ("id")
);

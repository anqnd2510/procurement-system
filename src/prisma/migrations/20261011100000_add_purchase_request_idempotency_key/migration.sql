-- Add an application-provided key so create retries cannot create duplicates.
ALTER TABLE "purchase_requests"
ADD COLUMN "idempotency_key" TEXT;

CREATE UNIQUE INDEX "purchase_requests_idempotency_key_key"
ON "purchase_requests"("idempotency_key");

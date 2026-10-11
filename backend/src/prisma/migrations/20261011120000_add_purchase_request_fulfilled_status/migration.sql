ALTER TYPE "PurchaseRequestStatus" ADD VALUE 'FULFILLED';

ALTER TABLE "purchase_requests"
ADD COLUMN "fulfilled_at" TIMESTAMP(3);

-- Add nullable columns first so existing data can be backfilled safely.
ALTER TABLE "categories" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "products" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "inventory" ADD COLUMN "organization_id" TEXT;

-- Existing development data belongs to the seeded default organization.
UPDATE "categories"
SET "organization_id" = (
  SELECT "id" FROM "organizations" WHERE "slug" = 'acme-procurement' LIMIT 1
)
WHERE "organization_id" IS NULL;

UPDATE "products"
SET "organization_id" = (
  SELECT "id" FROM "organizations" WHERE "slug" = 'acme-procurement' LIMIT 1
)
WHERE "organization_id" IS NULL;

UPDATE "inventory" AS i
SET "organization_id" = p."organization_id"
FROM "products" AS p
WHERE i."product_id" = p."id" AND i."organization_id" IS NULL;

-- The database must contain the default organization before this migration runs.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "categories" WHERE "organization_id" IS NULL)
     OR EXISTS (SELECT 1 FROM "products" WHERE "organization_id" IS NULL)
     OR EXISTS (SELECT 1 FROM "inventory" WHERE "organization_id" IS NULL) THEN
    RAISE EXCEPTION 'Cannot backfill organization scope: default organization is missing';
  END IF;
END $$;

ALTER TABLE "categories" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "inventory" ALTER COLUMN "organization_id" SET NOT NULL;

CREATE INDEX "categories_organization_id_idx" ON "categories"("organization_id");
CREATE INDEX "products_organization_id_idx" ON "products"("organization_id");
CREATE INDEX "inventory_organization_id_idx" ON "inventory"("organization_id");

ALTER TABLE "categories" ADD CONSTRAINT "categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

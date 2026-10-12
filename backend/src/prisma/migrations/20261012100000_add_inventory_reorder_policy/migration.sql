ALTER TABLE "inventory"
ADD COLUMN "reorder_point" INTEGER,
ADD COLUMN "target_stock" INTEGER;

ALTER TABLE "inventory"
ADD CONSTRAINT "inventory_reorder_policy_check"
CHECK (
  ("reorder_point" IS NULL AND "target_stock" IS NULL)
  OR (
    "reorder_point" IS NOT NULL
    AND "target_stock" IS NOT NULL
    AND "reorder_point" >= 0
    AND "target_stock" > "reorder_point"
  )
);

CREATE INDEX "inventory_organization_id_reorder_point_idx"
ON "inventory"("organization_id", "reorder_point")
WHERE "reorder_point" IS NOT NULL;

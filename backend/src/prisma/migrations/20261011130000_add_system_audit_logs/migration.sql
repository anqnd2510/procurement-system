CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_organization_id_created_at_idx"
ON "audit_logs"("organization_id", "created_at");
CREATE INDEX "audit_logs_resource_type_resource_id_created_at_idx"
ON "audit_logs"("resource_type", "resource_id", "created_at");
CREATE INDEX "audit_logs_actor_user_id_created_at_idx"
ON "audit_logs"("actor_user_id", "created_at");

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_actor_user_id_fkey"
FOREIGN KEY ("actor_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

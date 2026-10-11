-- Existing members remain unassigned; do not infer departments from historical requests.
CREATE TYPE "DepartmentRole" AS ENUM ('MEMBER', 'LEAD');
ALTER TABLE "organization_members"
  ADD COLUMN "department_id" TEXT,
  ADD COLUMN "department_role" "DepartmentRole" NOT NULL DEFAULT 'MEMBER';

CREATE UNIQUE INDEX "departments_id_organization_id_key" ON "departments"("id", "organization_id");
CREATE INDEX "organization_members_department_id_organization_id_idx" ON "organization_members"("department_id", "organization_id");
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_department_id_organization_id_fkey"
  FOREIGN KEY ("department_id", "organization_id") REFERENCES "departments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "organization_members" ADD CONSTRAINT "department_lead_requires_assignment"
  CHECK ("department_role" <> 'LEAD' OR "department_id" IS NOT NULL);
CREATE UNIQUE INDEX "one_lead_per_department" ON "organization_members"("department_id") WHERE "department_role" = 'LEAD';

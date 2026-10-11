import type { OrganizationMember, Prisma } from '@prisma/client';

export function managesOrganization(member: Pick<OrganizationMember, 'role'>) {
  return member.role === 'OWNER' || member.role === 'MANAGER';
}

export function leadsDepartment(
  member: Pick<OrganizationMember, 'departmentId' | 'departmentRole'>,
) {
  return member.departmentRole === 'LEAD' && !!member.departmentId;
}

export function requestReadScope(
  member: OrganizationMember,
  userId: string,
): Prisma.PurchaseRequestWhereInput {
  if (managesOrganization(member)) return {};
  if (leadsDepartment(member))
    return {
      OR: [{ requesterId: userId }, { departmentId: member.departmentId! }],
    };
  return { requesterId: userId };
}

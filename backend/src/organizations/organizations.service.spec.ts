import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from './organizations.service';
import { OrganizationRole } from '@prisma/client';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prisma: { organizationMember: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      organizationMember: { findUnique: jest.fn() },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns a membership for a user in the organization', async () => {
    const membership = {
      organizationId: 'org-1',
      userId: 'user-1',
      role: OrganizationRole.MANAGER,
    };
    prisma.organizationMember.findUnique.mockResolvedValue(membership);

    await expect(service.getMembership('user-1', 'org-1')).resolves.toEqual(
      membership,
    );
  });

  it('rejects a user who is not a member of the organization', async () => {
    prisma.organizationMember.findUnique.mockResolvedValue(null);

    await expect(service.getMembership('user-1', 'org-1')).rejects.toThrow(
      'User is not a member of this organization',
    );
  });

  it('rejects a missing organization context', async () => {
    await expect(service.getMembership('user-1', '')).rejects.toThrow(
      'X-Organization-Id header is required',
    );
    expect(prisma.organizationMember.findUnique).not.toHaveBeenCalled();
  });
});

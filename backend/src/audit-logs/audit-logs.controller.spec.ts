import { AuditLogsController } from './audit-logs.controller';

describe('AuditLogsController', () => {
  const service = { findAll: jest.fn(), findFilterOptions: jest.fn() };
  const controller = new AuditLogsController(service as never);

  beforeEach(() => jest.clearAllMocks());

  it('passes the actor, organization and query to the audit service', async () => {
    const user = { id: 'user-id' } as never;
    const query = { page: 1, limit: 10 } as never;
    service.findAll.mockResolvedValue({ items: [], meta: {} });

    await controller.findAll(user, 'organization-id', query);

    expect(service.findAll).toHaveBeenCalledWith(
      'user-id',
      'organization-id',
      query,
    );
  });

  it('requests organization-scoped filter choices', async () => {
    await controller.filters({ id: 'user-id' } as never, 'organization-id');
    expect(service.findFilterOptions).toHaveBeenCalledWith(
      'user-id',
      'organization-id',
    );
  });
});

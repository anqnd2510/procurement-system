import { PurchaseRequestsController } from './purchase-requests.controller';

describe('PurchaseRequestsController', () => {
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    fulfill: jest.fn(),
  };
  const controller = new PurchaseRequestsController(service as never);
  const user = {
    id: 'user-id',
    email: 'employee@example.com',
    role: 'EMPLOYEE',
  } as never;

  beforeEach(() => jest.clearAllMocks());

  it('passes organization and user scope when creating a request', async () => {
    const dto = {
      departmentId: 'department-id',
      title: 'Office equipment',
      items: [],
    } as never;
    service.create.mockResolvedValue({ id: 'request-id' });

    await expect(
      controller.create(dto, user, 'organization-id'),
    ).resolves.toEqual({
      id: 'request-id',
    });
    expect(service.create).toHaveBeenCalledWith(
      'user-id',
      'organization-id',
      dto,
      undefined,
    );
  });

  it('passes filters to the list service', async () => {
    const query = { page: 1, limit: 10 } as never;
    service.findAll.mockResolvedValue({ items: [], meta: {} });

    await controller.findAll(user, 'organization-id', query);

    expect(service.findAll).toHaveBeenCalledWith(
      'user-id',
      'organization-id',
      query,
    );
  });

  it('passes request ID and organization scope to the detail service', async () => {
    service.findOne.mockResolvedValue({ id: 'request-id' });

    await controller.findOne('request-id', user, 'organization-id');

    expect(service.findOne).toHaveBeenCalledWith(
      'request-id',
      'user-id',
      'organization-id',
    );
  });

  it('passes organization scope when fulfilling a request', async () => {
    service.fulfill.mockResolvedValue({ id: 'request-id' });

    await controller.fulfill('request-id', user, 'organization-id');

    expect(service.fulfill).toHaveBeenCalledWith(
      'request-id',
      'user-id',
      'organization-id',
    );
  });
});

import { PurchaseOrdersController } from './purchase-orders.controller';

describe('PurchaseOrdersController', () => {
  const service = {
    createFromRequest: jest.fn(),
    findOne: jest.fn(),
    issue: jest.fn(),
    receive: jest.fn(),
    cancel: jest.fn(),
  };
  const controller = new PurchaseOrdersController(service as never);
  const user = {
    id: 'user-id',
    email: 'manager@example.com',
    role: 'MANAGER',
  } as never;

  beforeEach(() => jest.clearAllMocks());

  it('passes request, user and organization scope when creating an order', async () => {
    const dto = { supplierName: 'Supplier' };
    service.createFromRequest.mockResolvedValue({ id: 'order-id' });

    await expect(
      controller.createFromRequest('request-id', dto, user, 'organization-id'),
    ).resolves.toEqual({ id: 'order-id' });
    expect(service.createFromRequest).toHaveBeenCalledWith(
      'request-id',
      'user-id',
      'organization-id',
      dto,
    );
  });

  it('passes organization scope when retrieving an order', async () => {
    service.findOne.mockResolvedValue({ id: 'order-id' });

    await controller.findOne('order-id', user, 'organization-id');

    expect(service.findOne).toHaveBeenCalledWith(
      'order-id',
      'user-id',
      'organization-id',
    );
  });

  it('passes organization scope when issuing an order', async () => {
    service.issue.mockResolvedValue({ id: 'order-id' });

    await controller.issue('order-id', user, 'organization-id');

    expect(service.issue).toHaveBeenCalledWith(
      'order-id',
      'user-id',
      'organization-id',
    );
  });

  it('passes organization scope when receiving an order', async () => {
    service.receive.mockResolvedValue({ id: 'order-id' });

    await controller.receive('order-id', user, 'organization-id');

    expect(service.receive).toHaveBeenCalledWith(
      'order-id',
      'user-id',
      'organization-id',
    );
  });

  it('passes organization scope when cancelling an order', async () => {
    service.cancel.mockResolvedValue({ id: 'order-id' });

    await controller.cancel('order-id', user, 'organization-id');

    expect(service.cancel).toHaveBeenCalledWith(
      'order-id',
      'user-id',
      'organization-id',
    );
  });
});

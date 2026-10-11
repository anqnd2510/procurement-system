import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { InventoryTransactionQueryDto } from './inventory-transaction-query.dto';

describe('InventoryTransactionQueryDto', () => {
  it('transforms and accepts valid filters and pagination', async () => {
    const query = plainToInstance(InventoryTransactionQueryDto, {
      page: '2',
      limit: '25',
      type: 'STOCK_IN',
      referenceId: '8b67af55-7655-4d05-92be-3de79075e6e4',
    });

    await expect(validate(query)).resolves.toHaveLength(0);
    expect(query.page).toBe(2);
    expect(query.limit).toBe(25);
  });

  it('rejects unsupported transaction types and malformed references', async () => {
    const query = plainToInstance(InventoryTransactionQueryDto, {
      type: 'ADJUSTMENT',
      referenceId: 'not-a-uuid',
    });

    const errors = await validate(query);
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['type', 'referenceId']),
    );
  });
});

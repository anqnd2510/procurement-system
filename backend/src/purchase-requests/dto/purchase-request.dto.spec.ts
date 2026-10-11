import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePurchaseRequestDto } from './create-purchase-request.dto';
import { RejectPurchaseRequestDto } from './reject-purchase-request.dto';
import { ApprovePurchaseRequestDto } from './approve-purchase-request.dto';

describe('Purchase request DTOs', () => {
  it('accepts a valid request with nested items', async () => {
    const dto = plainToInstance(CreatePurchaseRequestDto, {
      departmentId: '8b67af55-7655-4d05-92be-3de79075e6e4',
      title: 'New employee laptops',
      items: [
        {
          description: 'Business laptop',
          quantity: 2,
          estimatedUnitPrice: 1299.99,
        },
      ],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects a request without items or with an invalid quantity', async () => {
    const dto = plainToInstance(CreatePurchaseRequestDto, {
      departmentId: '8b67af55-7655-4d05-92be-3de79075e6e4',
      title: 'Invalid request',
      items: [
        {
          description: 'Invalid item',
          quantity: 0,
          estimatedUnitPrice: 100,
        },
      ],
    });

    const errors = await validate(dto);
    const itemsError = errors.find((error) => error.property === 'items');
    expect(itemsError).toBeDefined();
    expect(itemsError?.children?.[0]?.property).toBe('0');
    expect(
      itemsError?.children?.[0]?.children?.some(
        (error) => error.property === 'quantity',
      ),
    ).toBe(true);
  });

  it('requires a reason when rejecting a request', async () => {
    const dto = plainToInstance(RejectPurchaseRequestDto, {});

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toContain('reason');
  });

  it.each(['', '   \n\t', 'x'.repeat(1001), 123])(
    'rejects a blank, oversized or non-string rejection reason (%s)',
    async (reason) => {
      const dto = plainToInstance(RejectPurchaseRequestDto, { reason });
      expect((await validate(dto)).map((error) => error.property)).toContain(
        'reason',
      );
    },
  );

  it('trims review text and accepts an approval without a comment', async () => {
    const rejection = plainToInstance(RejectPurchaseRequestDto, {
      reason: '  Outside budget  ',
    });
    const approval = plainToInstance(ApprovePurchaseRequestDto, {
      comment: '  Within budget  ',
    });
    expect(rejection.reason).toBe('Outside budget');
    expect(approval.comment).toBe('Within budget');
    await expect(validate(rejection)).resolves.toHaveLength(0);
    await expect(validate(approval)).resolves.toHaveLength(0);
    await expect(
      validate(plainToInstance(ApprovePurchaseRequestDto, {})),
    ).resolves.toHaveLength(0);
  });
});

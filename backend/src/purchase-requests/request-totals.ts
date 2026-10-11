import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function requestTotal(
  items: { quantity: number; estimatedUnitPrice: number }[],
) {
  const total = items.reduce(
    (sum, item) =>
      sum.plus(
        new Prisma.Decimal(item.estimatedUnitPrice).times(item.quantity),
      ),
    new Prisma.Decimal(0),
  );
  if (total.gt('999999999999.99'))
    throw new BadRequestException(
      'The request total exceeds the supported limit',
    );
  return total;
}

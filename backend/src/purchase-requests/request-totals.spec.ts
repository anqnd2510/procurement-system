import { BadRequestException } from '@nestjs/common';
import { requestTotal } from './request-totals';

describe('Request monetary boundaries', () => {
  it('uses decimal arithmetic instead of binary floating-point totals', () => {
    expect(
      requestTotal([
        { quantity: 3, estimatedUnitPrice: 0.1 },
        { quantity: 1, estimatedUnitPrice: 0.2 },
      ]).toFixed(2),
    ).toBe('0.50');
  });
  it('rejects a combined total that cannot fit the database money column', () => {
    expect(() =>
      requestTotal([{ quantity: 2, estimatedUnitPrice: 999999999999.99 }]),
    ).toThrow(BadRequestException);
  });
});

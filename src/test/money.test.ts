import { describe, expect, it } from 'vitest';
import { calculateTotals, formatMoney } from '../../shared/lib/money';

describe('money calculations', () => {
  it('formats integer paise using INR and en-IN grouping', () => {
    expect(formatMoney(12_999_00)).toContain('12,999');
    expect(formatMoney(199_50)).toContain('199.50');
  });

  it('calculates free standard shipping and tax using integer paise', () => {
    expect(calculateTotals([{ pricePaise: 250_000, quantity: 2 }])).toEqual({
      subtotalPaise: 500_000,
      shippingPaise: 0,
      taxPaise: 90_000,
      totalPaise: 590_000,
    });
  });

  it('applies standard, express and pickup shipping rules', () => {
    const lines = [{ pricePaise: 100_000, quantity: 1 }];
    expect(calculateTotals(lines, 'standard').shippingPaise).toBe(9_900);
    expect(calculateTotals(lines, 'express').shippingPaise).toBe(24_900);
    expect(calculateTotals(lines, 'pickup').shippingPaise).toBe(0);
  });
});

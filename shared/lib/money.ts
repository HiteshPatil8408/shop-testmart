import { APP_CONFIG } from '../config';
import type { CartTotals } from '../types';

export function formatMoney(paise: number): string {
  return new Intl.NumberFormat(APP_CONFIG.locale, {
    style: 'currency',
    currency: APP_CONFIG.currency,
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

export function calculateTotals(
  lines: Array<{ pricePaise: number; quantity: number }>,
  delivery: 'standard' | 'express' | 'pickup' = 'standard',
): CartTotals {
  const subtotalPaise = lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
  const shippingPaise =
    delivery === 'pickup'
      ? 0
      : delivery === 'express'
        ? APP_CONFIG.expressShippingPaise
        : subtotalPaise >= APP_CONFIG.freeShippingThresholdPaise
          ? 0
          : subtotalPaise > 0
            ? APP_CONFIG.standardShippingPaise
            : 0;
  const taxPaise = Math.round(subtotalPaise * APP_CONFIG.taxRate);
  return {
    subtotalPaise,
    shippingPaise,
    taxPaise,
    totalPaise: subtotalPaise + shippingPaise + taxPaise,
  };
}

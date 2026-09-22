import { describe, expect, it } from 'vitest';
import {
  cartItemSchema,
  changePasswordSchema,
  adminBulkOrderUpdateSchema,
  adminOrderUpdateSchema,
  orderSchema,
  passwordSchema,
  registrationSchema,
  reviewSchema,
  resetPasswordSchema,
} from '../../shared/schemas';

describe('validation schemas', () => {
  it.each(['short', 'alllowercase123!', 'ALLUPPERCASE123!', 'NoNumbersHere!'])(
    'rejects weak password %s',
    (password) => expect(passwordSchema.safeParse(password).success).toBe(false),
  );

  it('accepts the documented demo password rules', () => {
    expect(passwordSchema.safeParse('Test@12345').success).toBe(true);
  });

  it('enforces cart quantity boundaries', () => {
    const base = {
      productId: '10000000-0000-4000-8000-000000000001',
      variantId: '20000000-0000-4000-8000-000000000001',
    };
    expect(cartItemSchema.safeParse({ ...base, quantity: 0 }).success).toBe(false);
    expect(cartItemSchema.safeParse({ ...base, quantity: 1 }).success).toBe(true);
    expect(cartItemSchema.safeParse({ ...base, quantity: 21 }).success).toBe(false);
  });

  it('requires matching passwords and terms during registration', () => {
    const value = {
      username: 'qa_user',
      email: 'qa@example.test',
      password: 'Strong@1234',
      confirmPassword: 'Different@1234',
      securityQuestionId: 'childhood-book',
      securityAnswer: 'The Secret Garden',
      firstName: 'QA',
      lastName: 'User',
      phone: '+91 90000 00000',
      country: 'India',
      city: 'Pune',
      street: '101 Test Lane',
      state: 'Maharashtra',
      postalCode: '411001',
      label: 'Home',
      isDefault: true,
      marketingOptIn: false,
      termsAccepted: true,
    };
    expect(registrationSchema.safeParse(value).success).toBe(false);
    expect(
      registrationSchema.safeParse({ ...value, confirmPassword: value.password }).success,
    ).toBe(true);
  });

  it('requires password confirmation for recovery and signed-in changes', () => {
    expect(
      resetPasswordSchema.safeParse({
        email: 'qa@example.test',
        securityQuestionId: 'childhood-book',
        securityAnswer: 'The Secret Garden',
        password: 'Strong@1234',
        confirmPassword: 'Different@1234',
      }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'Current@1234',
        password: 'NewStrong@1234',
        confirmPassword: 'NewStrong@1234',
      }).success,
    ).toBe(true);
  });

  it('requires a supported security question and meaningful answer', () => {
    expect(
      resetPasswordSchema.safeParse({
        email: 'qa@example.test',
        securityQuestionId: 'not-a-question',
        securityAnswer: 'x',
        password: 'Strong@1234',
        confirmPassword: 'Strong@1234',
      }).success,
    ).toBe(false);
  });

  it('validates product review boundaries', () => {
    expect(
      reviewSchema.safeParse({
        rating: 5,
        title: 'Very good',
        message: 'A detailed review with enough information for another demo shopper.',
      }).success,
    ).toBe(true);
    expect(reviewSchema.safeParse({ rating: 0, title: 'Bad', message: 'Too short' }).success).toBe(
      false,
    );
  });

  it('validates delivery slots and admin status mutations', () => {
    const address = {
      label: 'Home',
      firstName: 'Demo',
      lastName: 'Tester',
      phone: '+91 90000 00000',
      street: '101 Test Lane',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411001',
      country: 'India',
      isDefault: true,
    };
    expect(
      orderSchema.safeParse({
        address,
        deliveryMethod: 'standard',
        deliveryDate: '2026-10-10',
        deliveryTimeSlot: '12:00-15:00',
        payment: { type: 'wallet' },
      }).success,
    ).toBe(true);
    expect(
      orderSchema.safeParse({
        address,
        deliveryMethod: 'standard',
        deliveryDate: 'not-a-date',
        deliveryTimeSlot: 'overnight',
        payment: { type: 'wallet' },
      }).success,
    ).toBe(false);
    expect(adminOrderUpdateSchema.safeParse({ status: 'shipped' }).success).toBe(true);
    expect(adminOrderUpdateSchema.safeParse({ status: 'lost' }).success).toBe(false);
    expect(
      adminBulkOrderUpdateSchema.safeParse({
        ids: ['80000000-0000-4000-8000-000000000001'],
        status: 'packed',
      }).success,
    ).toBe(true);
    expect(adminBulkOrderUpdateSchema.safeParse({ ids: [], status: 'packed' }).success).toBe(false);
  });
});

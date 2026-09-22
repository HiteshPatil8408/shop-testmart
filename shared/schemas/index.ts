import { z } from 'zod';
import { SECURITY_QUESTION_IDS } from '../config';

export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .max(128)
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/\d/, 'Include a number.')
  .regex(/[^A-Za-z0-9]/, 'Include a special character.');

export const securityQuestionIdSchema = z.enum(SECURITY_QUESTION_IDS, {
  error: 'Choose a security question.',
});

export const securityAnswerSchema = z
  .string()
  .trim()
  .min(3, 'Enter an answer with at least 3 characters.')
  .max(128, 'Keep the answer under 128 characters.');

export const addressSchema = z.object({
  label: z.string().trim().min(1).max(40).default('Home'),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number.'),
  street: z.string().trim().min(5).max(180),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9 -]{4,12}$/, 'Enter a valid postal code.'),
  country: z.string().trim().min(2).max(80),
  isDefault: z.boolean().default(false),
});

export const registrationSchema = addressSchema
  .extend({
    username: z
      .string()
      .trim()
      .min(3)
      .max(24)
      .regex(/^[a-zA-Z][a-zA-Z0-9_-]+$/, 'Use letters, numbers, underscores or hyphens.'),
    email: z.email('Enter a valid email address.').transform((value) => value.toLowerCase()),
    password: passwordSchema,
    confirmPassword: z.string(),
    securityQuestionId: securityQuestionIdSchema,
    securityAnswer: securityAnswerSchema,
    marketingOptIn: z.boolean().default(false),
    termsAccepted: z.literal(true, { error: 'You must accept the demo terms.' }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })
  .refine(
    (value) =>
      value.securityAnswer.toLocaleLowerCase('en-US') !== value.password.toLocaleLowerCase('en-US'),
    {
      path: ['securityAnswer'],
      message: 'Use an answer different from your password.',
    },
  );

export const updateSecurityQuestionSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  securityQuestionId: securityQuestionIdSchema,
  securityAnswer: securityAnswerSchema,
});

export const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export const resetPasswordSchema = z
  .object({
    email: z.email('Enter a valid email address.').transform((value) => value.trim().toLowerCase()),
    securityQuestionId: securityQuestionIdSchema,
    securityAnswer: securityAnswerSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })
  .refine((value) => value.password !== value.currentPassword, {
    path: ['password'],
    message: 'Choose a password different from your current password.',
  });

export const contactSchema = z.object({
  categoryId: z.string().uuid(),
  productId: z.string().uuid().optional().or(z.literal('')),
  email: z.email(),
  subject: z.string().trim().min(4).max(120),
  message: z.string().trim().min(20).max(2000),
});

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});

export const cartUpdateSchema = z.object({
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(20).optional(),
});

export const orderSchema = z.object({
  address: addressSchema,
  deliveryMethod: z.enum(['standard', 'express', 'pickup']),
  deliveryDate: z.string().date().optional(),
  deliveryTimeSlot: z.enum(['09:00-12:00', '12:00-15:00', '15:00-18:00']).optional(),
  payment: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('card'),
      cardholderName: z.string().trim().min(2).max(100),
      cardNumber: z.string().regex(/^4[0-9]{15}$/),
      expiryMonth: z.number().int().min(1).max(12),
      expiryYear: z.number().int().min(new Date().getUTCFullYear()).max(2100),
    }),
    z.object({ type: z.literal('cod') }),
    z.object({ type: z.literal('wallet') }),
  ]),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(4, 'Use at least 4 characters.').max(80),
  message: z.string().trim().min(20, 'Use at least 20 characters.').max(1000),
});

export const adminOrderUpdateSchema = z.object({
  status: z.enum(['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']),
});

export const adminBulkOrderUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']),
});

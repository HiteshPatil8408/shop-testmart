export const APP_CONFIG = {
  name: 'TestMart',
  shortName: 'TM',
  currency: 'INR',
  locale: 'en-IN',
  supportEmail: 'help@testmart.demo',
  demoEmail: 'tester@testmart.demo',
  demoPassword: 'Test@12345',
  taxRate: 0.18,
  freeShippingThresholdPaise: 500_000,
  standardShippingPaise: 9_900,
  expressShippingPaise: 24_900,
} as const;

export const SITE_METADATA = {
  url: 'https://shop.testmart.workers.dev',
  title: 'UI Testing Environment for QA Automation | TestMart',
  description:
    'Practice UI testing, end-to-end automation, accessibility checks and API validation in a safe, deterministic ecommerce testing environment.',
  socialImage: '/images/products/aster-novabook-14-deep-navy-01.jpg',
} as const;

export const DEMO_SAFETY_NOTICE =
  'Demo application — do not enter real personal or payment information.';

export const SECURITY_QUESTIONS = [
  { id: 'childhood-book', label: 'What was the title of a favourite childhood book?' },
  { id: 'first-school', label: 'What was the name of your first school?' },
  { id: 'childhood-nickname', label: 'What childhood nickname did your family use for you?' },
  { id: 'memorable-place', label: 'What place from your childhood is most memorable to you?' },
  { id: 'first-teacher', label: 'What was the name of your first teacher?' },
] as const;

export const SECURITY_QUESTION_IDS = SECURITY_QUESTIONS.map((question) => question.id) as [
  (typeof SECURITY_QUESTIONS)[number]['id'],
  ...(typeof SECURITY_QUESTIONS)[number]['id'][],
];

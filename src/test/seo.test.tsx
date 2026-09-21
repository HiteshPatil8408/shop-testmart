import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

afterEach(() => {
  document.head.innerHTML = '';
  window.history.replaceState({}, '', '/');
});

describe('page metadata', () => {
  it('sets an indexable title, description, canonical URL and social metadata', () => {
    renderHook(() =>
      useDocumentTitle('API documentation', {
        canonicalPath: '/api-docs',
        description: 'API testing reference.',
      }),
    );

    expect(document.title).toBe('API documentation | TestMart');
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      'API testing reference.',
    );
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      expect.stringContaining('index, follow'),
    );
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://shop.testmart.workers.dev/api-docs',
    );
    expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://shop.testmart.workers.dev/api-docs',
    );
  });

  it('keeps utility routes out of search results', () => {
    window.history.replaceState({}, '', '/cart?from=test');
    renderHook(() => useDocumentTitle('Your cart'));

    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, follow',
    );
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://shop.testmart.workers.dev/cart',
    );
  });
});

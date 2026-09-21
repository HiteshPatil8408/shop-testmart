import { describe, expect, it } from 'vitest';
import { serializeProductQuery } from '../../shared/lib/query';

describe('catalogue URL serialization', () => {
  it('creates a stable bookmarkable query and omits defaults', () => {
    expect(
      serializeProductQuery({
        q: 'wireless',
        category: 'mice',
        sort: 'price_asc',
        minPrice: 500,
        maxPrice: 5000,
        colours: ['Sunset Coral', 'Deep Navy'],
        inStock: true,
        minRating: 4,
        page: 2,
        view: 'list',
      }),
    ).toBe(
      'q=wireless&category=mice&sort=price_asc&minPrice=500&maxPrice=5000&colour=Deep+Navy&colour=Sunset+Coral&inStock=1&rating=4&page=2&view=list',
    );
    expect(serializeProductQuery({ sort: 'relevance', page: 1, view: 'grid' })).toBe('');
  });
});

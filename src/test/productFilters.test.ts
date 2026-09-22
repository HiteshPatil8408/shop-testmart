import { describe, expect, it } from 'vitest';
import { applyProductFilters } from '../../shared/lib/productFilters';
import type { Product } from '../../shared/types';

const product = (overrides: Partial<Product>): Product => ({
  id: '1',
  slug: 'nova',
  name: 'NovaBook',
  manufacturer: 'Aster Labs',
  categoryId: 'c1',
  category: 'laptops',
  categoryName: 'Laptops',
  shortDescription: 'Portable work computer',
  description: 'Details',
  pricePaise: 5000000,
  originalPricePaise: null,
  rating: 4.7,
  reviewCount: 20,
  stock: 5,
  featured: false,
  popular: false,
  keywords: ['student'],
  images: [],
  variants: [{ id: 'v1', colour: 'Deep Navy', colourHex: '#000', stock: 5, images: [] }],
  specifications: [],
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('product filters', () => {
  const products = [
    product({ id: '1' }),
    product({
      id: '2',
      name: 'Loop Buds',
      manufacturer: 'Kinetic Sound',
      category: 'headphones',
      categoryName: 'Headphones',
      pricePaise: 2000000,
      rating: 3.8,
      stock: 0,
      keywords: ['wireless'],
      variants: [{ id: 'v2', colour: 'Sunset Coral', colourHex: '#f00', stock: 0, images: [] }],
    }),
  ];

  it('searches across manufacturer, category, description and keywords', () => {
    expect(applyProductFilters(products, { query: 'aster' }).map((item) => item.id)).toEqual(['1']);
    expect(applyProductFilters(products, { query: 'wireless' }).map((item) => item.id)).toEqual([
      '2',
    ]);
  });

  it('combines category, rating, colour and stock filters', () => {
    expect(
      applyProductFilters(products, {
        category: 'laptops',
        minimumRating: 4,
        colours: ['Deep Navy'],
        inStock: true,
      }),
    ).toHaveLength(1);
    expect(applyProductFilters(products, { inStock: true })).toHaveLength(1);
  });

  it('applies integer-paise price boundaries and specification search', () => {
    expect(
      applyProductFilters(products, { minimumPrice: 4_000_000, maximumPrice: 5_000_000 }),
    ).toHaveLength(1);
    expect(applyProductFilters(products, { maximumPrice: 4_999_999 })).toHaveLength(1);
    expect(applyProductFilters(products, { minimumPrice: 5_000_001 })).toHaveLength(0);
    expect(applyProductFilters(products, { specification: '16 GB' })).toHaveLength(0);
  });
});

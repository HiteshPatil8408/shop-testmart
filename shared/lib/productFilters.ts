import type { Product } from '../types';

export interface LocalProductFilters {
  query?: string;
  category?: string;
  minimumRating?: number;
  inStock?: boolean;
  colours?: string[];
}

export function applyProductFilters(products: Product[], filters: LocalProductFilters) {
  const query = filters.query?.trim().toLowerCase();
  return products.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.minimumRating && product.rating < filters.minimumRating) return false;
    if (filters.inStock && product.stock < 1) return false;
    if (
      filters.colours?.length &&
      !product.variants.some((variant) =>
        filters.colours!.some((colour) => colour.toLowerCase() === variant.colour.toLowerCase()),
      )
    )
      return false;
    if (
      query &&
      ![
        product.name,
        product.manufacturer,
        product.categoryName,
        product.shortDescription,
        ...product.keywords,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
      return false;
    return true;
  });
}

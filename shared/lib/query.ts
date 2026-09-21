export interface ProductQuery {
  q?: string;
  category?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  colours?: string[];
  inStock?: boolean;
  minRating?: number;
  page?: number;
  view?: 'grid' | 'list';
}

export function serializeProductQuery(query: ProductQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.sort && query.sort !== 'relevance') params.set('sort', query.sort);
  if (query.minPrice !== undefined) params.set('minPrice', String(query.minPrice));
  if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice));
  query.colours?.sort().forEach((colour) => params.append('colour', colour));
  if (query.inStock) params.set('inStock', '1');
  if (query.minRating) params.set('rating', String(query.minRating));
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.view === 'list') params.set('view', 'list');
  return params.toString();
}

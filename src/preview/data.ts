import type { Category, CategorySlug, Product } from '../../shared/types';
import { APP_CONFIG } from '../../shared/config';

const base = import.meta.env.BASE_URL;

const categorySeed: Array<[CategorySlug, string, string]> = [
  ['laptops', 'Laptops', 'Portable computers for study, work and creative projects.'],
  ['tablets', 'Tablets', 'Versatile touch-first devices for reading, sketching and entertainment.'],
  ['headphones', 'Headphones', 'Comfortable personal audio for calls and focused listening.'],
  ['speakers', 'Speakers', 'Room-filling sound in compact, original designs.'],
  ['mice', 'Mice', 'Precise pointing devices for productivity and play.'],
];

const assetName: Record<CategorySlug, string> = {
  laptops: 'laptop',
  tablets: 'tablet',
  headphones: 'headphones',
  speakers: 'speaker',
  mice: 'mouse',
};

export const previewCategories: Category[] = categorySeed.map(
  ([slug, name, description], index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    slug,
    name,
    description,
    image: `${base}images/${assetName[slug]}-teal.svg`,
    productCount: 6,
  }),
);

const productSeed: Record<
  CategorySlug,
  Array<[string, string, string, number, number | null, number]>
> = {
  laptops: [
    ['aster-novabook-14', 'NovaBook 14', 'Aster Labs', 7_499_000, 8_299_000, 4.7],
    ['meridian-forge-16', 'Forge 16', 'Meridian Works', 12_999_000, 13_999_000, 4.8],
    ['velo-airleaf-13', 'Airleaf 13', 'Velo Computing', 5_899_000, 6_499_000, 4.5],
    ['northstar-studio-15', 'Studio 15', 'Northstar Digital', 10_999_000, null, 4.6],
    ['aster-circuitbook-15', 'CircuitBook 15', 'Aster Labs', 4_699_000, 5_199_000, 4.3],
    ['meridian-fieldbook-14', 'FieldBook 14', 'Meridian Works', 6_799_000, null, 4.4],
  ],
  tablets: [
    ['solace-canvas-11', 'Canvas 11', 'Solace Devices', 3_999_000, 4_499_000, 4.7],
    ['ember-slate-10', 'Slate 10', 'Ember Mobile', 2_299_000, 2_699_000, 4.4],
    ['solace-pocketpad-8', 'PocketPad 8', 'Solace Devices', 1_699_000, null, 4.2],
    ['quanta-board-pro-13', 'Board Pro 13', 'Quanta House', 7_199_000, 7_899_000, 4.8],
    ['ember-playtab-11', 'PlayTab 11', 'Ember Mobile', 3_299_000, 3_699_000, 4.5],
    ['quanta-junior-tab', 'Junior Tab', 'Quanta House', 1_899_000, null, 4.3],
  ],
  headphones: [
    ['sonora-hushwave-700', 'HushWave 700', 'Sonora Audio', 2_499_000, 2_899_000, 4.8],
    ['kinetic-loop-buds', 'Loop Buds', 'Kinetic Sound', 799_000, 999_000, 4.4],
    ['sonora-studio-monitor-50', 'Studio Monitor 50', 'Sonora Audio', 1_199_000, null, 4.6],
    ['kinetic-cloudlite-300', 'CloudLite 300', 'Kinetic Sound', 549_000, 699_000, 4.2],
    ['auraloom-openair', 'OpenAir', 'Auraloom', 899_000, 1_099_000, 4.3],
    ['auraloom-nightsong', 'NightSong', 'Auraloom', 449_000, null, 4.1],
  ],
  speakers: [
    ['echopeak-room-one', 'Room One', 'EchoPeak', 1_499_000, 1_699_000, 4.7],
    ['roamworks-trailbeat', 'TrailBeat', 'Roamworks', 699_000, 849_000, 4.6],
    ['echopeak-cinema-bar', 'Cinema Bar', 'EchoPeak', 2_199_000, 2_499_000, 4.5],
    ['roamworks-pocket-pulse', 'Pocket Pulse', 'Roamworks', 299_000, 399_000, 4.2],
    ['harmonic-grid-duo', 'Grid Duo', 'Harmonic Field', 2_799_000, null, 4.8],
    ['harmonic-field-clockradio', 'Daybreak Radio', 'Harmonic Field', 599_000, null, 4.3],
  ],
  mice: [
    ['pixelgrove-precision-s', 'Precision S', 'PixelGrove', 349_000, 449_000, 4.6],
    ['vectorfox-sprint-8', 'Sprint 8', 'VectorFox', 499_000, 599_000, 4.7],
    ['pixelgrove-travel-dot', 'Travel Dot', 'PixelGrove', 179_000, 229_000, 4.2],
    ['vectorfox-command-12', 'Command 12', 'VectorFox', 699_000, 799_000, 4.5],
    ['kinova-vertical-ease', 'Vertical Ease', 'Kinova Design', 429_000, null, 4.4],
    ['kinova-track-orbit', 'Track Orbit', 'Kinova Design', 549_000, null, 4.3],
  ],
};

const variantSeed: Record<CategorySlug, Array<[string, string, string]>> = {
  laptops: [
    ['Deep Navy', '#173f5f', 'deep-navy'],
    ['Warm Silver', '#c2ccd3', 'warm-silver'],
  ],
  tablets: [
    ['Lagoon Teal', '#1f9e9a', 'lagoon-teal'],
    ['Sunset Coral', '#ed7966', 'sunset-coral'],
  ],
  headphones: [
    ['Night Navy', '#173f5f', 'night-navy'],
    ['Sunset Coral', '#ed7966', 'sunset-coral'],
  ],
  speakers: [
    ['Harbour Blue', '#173f5f', 'harbour-blue'],
    ['Terracotta', '#ed7966', 'terracotta'],
  ],
  mice: [
    ['Graphite', '#3d4248', 'graphite'],
    ['Mist Silver', '#b9c5cb', 'mist-silver'],
  ],
};

let productIndex = 0;
export const previewProducts: Product[] = categorySeed.flatMap(([category, categoryName]) =>
  productSeed[category].map(
    ([slug, name, manufacturer, pricePaise, originalPricePaise, rating]) => {
      productIndex += 1;
      const suffix = String(productIndex).padStart(12, '0');
      const categoryId = previewCategories.find((item) => item.slug === category)!.id;
      const variants = variantSeed[category].map(
        ([colour, colourHex, imageSlug], variantIndex) => ({
          id: `${variantIndex === 0 ? '20000000' : '21000000'}-0000-4000-8000-${suffix}`,
          colour,
          colourHex,
          stock: (variantIndex === 0 ? 8 : 4) + productIndex,
          images: [
            `${base}images/products/${slug}-${imageSlug}-01.jpg`,
            `${base}images/products/${slug}-${imageSlug}-02.jpg`,
          ],
        }),
      );
      return {
        id: `10000000-0000-4000-8000-${suffix}`,
        slug,
        name,
        manufacturer,
        categoryId,
        category,
        categoryName,
        shortDescription: `A thoughtfully designed ${categoryName.toLowerCase()} product for everyday work and play.`,
        description: `${name} combines dependable performance, straightforward controls and an original ${APP_CONFIG.name} design. This static preview uses committed catalogue data.`,
        pricePaise,
        originalPricePaise,
        rating,
        reviewCount: 70 + productIndex * 19,
        stock: 12 + productIndex,
        featured: productIndex % 6 === 1,
        popular: productIndex % 3 === 1,
        keywords: [category, 'demo', 'technology', manufacturer.toLowerCase()],
        images: [...variants[0].images],
        variants,
        specifications: [
          { name: 'Preview mode', value: 'Committed static data' },
          { name: 'Warranty', value: 'Fictional two-year demo warranty' },
        ],
        createdAt: `2026-${String(((productIndex - 1) % 8) + 1).padStart(2, '0')}-01T09:00:00Z`,
        updatedAt: '2026-09-01T09:00:00Z',
      };
    },
  ),
);

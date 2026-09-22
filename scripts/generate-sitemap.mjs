import { readFileSync, writeFileSync } from 'node:fs';

const siteUrl = 'https://shop.testmart.workers.dev';
const seed = readFileSync(new URL('../seed/seed.sql', import.meta.url), 'utf8');
const categoryBlock = seed.match(/INSERT OR REPLACE INTO categories[\s\S]*?;/)?.[0];
const productBlock = seed.match(/INSERT OR REPLACE INTO products[\s\S]*?;\n\nWITH ordered/)?.[0];

if (!categoryBlock || !productBlock) {
  throw new Error('Unable to find catalogue records in seed/seed.sql.');
}

const categories = [...categoryBlock.matchAll(/\('[^']+', '([^']+)',/g)].map((match) => ({
  path: `/category/${match[1]}`,
}));
const products = [
  ...productBlock.matchAll(/^\('[^']+','[^']+','([^']+)',.*,'(\d{4}-\d{2}-\d{2})T[^']+'\),?$/gm),
].map((match) => ({ path: `/products/${match[1]}`, lastModified: match[2] }));

if (!categories.length || !products.length) {
  throw new Error('The sitemap generator found no catalogue URLs.');
}

const pages = [
  { path: '/' },
  { path: '/products' },
  { path: '/api-docs' },
  { path: '/contact' },
  { path: '/ui-lab' },
  ...categories,
  ...products,
];
const urls = pages
  .map(
    ({ path, lastModified }) =>
      `  <url>\n    <loc>${new URL(path, `${siteUrl}/`).href}</loc>${
        lastModified ? `\n    <lastmod>${lastModified}</lastmod>` : ''
      }\n  </url>`,
  )
  .join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(new URL('../public/sitemap.xml', import.meta.url), sitemap);
console.log(`Generated sitemap with ${pages.length} URLs.`);

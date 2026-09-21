import { useEffect } from 'react';
import { APP_CONFIG, SITE_METADATA } from '../../shared/config';

interface PageMetadataOptions {
  canonicalPath?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
}

const utilityRoute =
  /^\/(?:account|cart|checkout|forgot-password|login|orders|register|reset-password|search)(?:\/|$)/;

function currentRoutePath() {
  const hashPath = window.location.hash.match(/^#(\/[^?]*)/i)?.[1];
  return hashPath ?? window.location.pathname;
}

function canonicalUrl(path: string) {
  const safePath = `/${path.replace(/^\/+/, '')}`;
  return new URL(safePath, `${SITE_METADATA.url}/`).href;
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function useDocumentTitle(title?: string, options: PageMetadataOptions = {}) {
  const {
    canonicalPath,
    description = SITE_METADATA.description,
    image = SITE_METADATA.socialImage,
    noIndex,
  } = options;

  useEffect(() => {
    const routePath = canonicalPath ?? currentRoutePath();
    const pageTitle = title ? `${title} | ${APP_CONFIG.name}` : SITE_METADATA.title;
    const canonical = canonicalUrl(routePath);
    const socialImage = new URL(image, `${SITE_METADATA.url}/`).href;
    const shouldNoIndex =
      import.meta.env.VITE_STATIC_PREVIEW === 'true' || noIndex || utilityRoute.test(routePath);

    document.title = pageTitle;
    setMeta('name', 'description', description);
    setMeta(
      'name',
      'robots',
      shouldNoIndex
        ? 'noindex, follow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    );
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', APP_CONFIG.name);
    setMeta('property', 'og:locale', 'en_IN');
    setMeta('property', 'og:title', pageTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:image', socialImage);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', pageTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', socialImage);

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;
  }, [canonicalPath, description, image, noIndex, title]);
}

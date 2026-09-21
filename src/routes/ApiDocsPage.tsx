import { useState } from 'react';
import { APP_CONFIG } from '../../shared/config';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface OpenApi {
  info: { title: string; version: string; description: string };
  paths: Record<string, Record<string, { summary?: string; tags?: string[] }>>;
}

export function ApiDocsPage() {
  useDocumentTitle('API documentation');
  const [filter, setFilter] = useState('');
  const result = useAsync(async () => {
    if (import.meta.env.VITE_STATIC_PREVIEW === 'true')
      return {
        info: {
          title: `${APP_CONFIG.name} API`,
          version: '1.0.0',
          description:
            'The static Pages preview has no server API. Deploy the Cloudflare Worker for these endpoints.',
        },
        paths: {},
      } satisfies OpenApi;
    const response = await fetch('/api/openapi.json');
    if (!response.ok) throw new Error('Unable to load the OpenAPI document.');
    return response.json() as Promise<OpenApi>;
  }, []);
  const endpoints = result.data
    ? Object.entries(result.data.paths)
        .flatMap(([path, methods]) =>
          Object.entries(methods).map(([method, value]) => ({ path, method, ...value })),
        )
        .filter((item) =>
          `${item.method} ${item.path} ${item.summary}`
            .toLowerCase()
            .includes(filter.toLowerCase()),
        )
    : [];
  return (
    <div className="page container docs-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">OpenAPI 3.1</p>
          <h1>{result.data?.info.title ?? `${APP_CONFIG.name} API`}</h1>
          <p>{result.data?.info.description}</p>
        </div>
        {import.meta.env.VITE_STATIC_PREVIEW !== 'true' && (
          <a className="button button--secondary" href="/api/openapi.json" download>
            Download JSON
          </a>
        )}
      </div>
      <div className="docs-intro">
        <code>/api/v1</code>
        <p>
          All responses use consistent <code>data/meta</code> or <code>error/meta</code> envelopes.
          Auth uses an HTTP-only same-site cookie.
        </p>
      </div>
      <label className="docs-filter">
        Filter endpoints
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="orders, cart, auth…"
        />
      </label>
      <div className="endpoint-list">
        {endpoints.map((endpoint) => (
          <details key={`${endpoint.method}-${endpoint.path}`}>
            <summary>
              <span className={`method method--${endpoint.method}`}>
                {endpoint.method.toUpperCase()}
              </span>
              <code>{endpoint.path}</code>
              <strong>{endpoint.summary}</strong>
            </summary>
            <div>
              <p>Tag: {endpoint.tags?.join(', ') ?? 'General'}</p>
              <p>
                Try this endpoint with Playwright’s API request context or any same-origin fetch
                client.
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

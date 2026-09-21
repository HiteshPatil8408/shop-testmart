import { useCallback, useEffect, useState } from 'react';

export function useAsync<T>(loader: () => Promise<T>, dependencies: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (reason) {
      setError(reason instanceof Error ? reason : new Error('Unable to load data.'));
    } finally {
      setLoading(false);
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => void load(), [load]);
  return { data, loading, error, reload: load };
}

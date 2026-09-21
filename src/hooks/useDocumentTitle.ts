import { useEffect } from 'react';
import { APP_CONFIG } from '../../shared/config';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_CONFIG.name}` : APP_CONFIG.name;
  }, [title]);
}

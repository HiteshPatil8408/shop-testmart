import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { consumeQaSimulation, setQaClientConfig, type QaClientConfig } from '../lib/api';

interface QaValue extends QaClientConfig {
  set: (patch: Partial<QaClientConfig>) => void;
  reset: () => void;
  consume: (key: keyof QaClientConfig) => boolean;
}

const initial: QaClientConfig = {
  latency: 0,
  forceStatus: null,
  emptySearch: false,
  lowStock: false,
  paymentDecline: false,
  sessionExpiry: false,
  offline: false,
  uploadFailure: false,
  slowUpload: false,
  reviewSubmissionFailure: false,
  duplicateSubmission: false,
  serverValidation: false,
  orderEventDelay: false,
  orderEventDisconnection: false,
  optimisticUpdateRejection: false,
  emptyTable: false,
  largeDataset: false,
  expiredCart: false,
  priceChanged: false,
  stockChanged: false,
  dateSlotUnavailable: false,
  failureMode: 'once',
};
const QaContext = createContext<QaValue | null>(null);

export function QaProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<QaClientConfig>(() => {
    try {
      const stored = { ...initial, ...JSON.parse(sessionStorage.getItem('tm_qa') ?? '{}') };
      setQaClientConfig(stored);
      return stored;
    } catch {
      setQaClientConfig(initial);
      return initial;
    }
  });
  useEffect(() => {
    setQaClientConfig(config);
    sessionStorage.setItem('tm_qa', JSON.stringify(config));
  }, [config]);
  useEffect(() => {
    const consumed = () => setConfig((current) => ({ ...current, forceStatus: null }));
    window.addEventListener('testmart:qa-force-consumed', consumed);
    return () => window.removeEventListener('testmart:qa-force-consumed', consumed);
  }, []);
  const value = useMemo(
    () => ({
      ...config,
      set: (patch: Partial<QaClientConfig>) =>
        setConfig((current) => {
          const next = { ...current, ...patch };
          setQaClientConfig(next);
          return next;
        }),
      reset: () => {
        setQaClientConfig(initial);
        setConfig(initial);
      },
      consume: consumeQaSimulation,
    }),
    [config],
  );
  return <QaContext.Provider value={value}>{children}</QaContext.Provider>;
}

export function useQa() {
  const value = useContext(QaContext);
  if (!value) throw new Error('useQa must be used inside QaProvider');
  return value;
}

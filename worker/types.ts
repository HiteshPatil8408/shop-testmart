import type { User } from '../shared/types';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  SESSION_SECRET?: string;
  APP_ENV?: string;
}

export interface AppVariables {
  requestId: string;
  user: User | null;
}

export type AppBindings = { Bindings: Env; Variables: AppVariables };

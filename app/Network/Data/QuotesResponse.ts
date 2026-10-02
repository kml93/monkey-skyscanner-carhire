import type { QuotesFilter } from './QuotesFilter';

/** carhire-quotes response body (raw API shape, only the fields read here). */
export interface QuotesResponse {
  readonly filters?: QuotesFilter[];
}

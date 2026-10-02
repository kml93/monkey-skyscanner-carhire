import type { QuotesFilterOption } from './QuotesFilterOption';

/** One filter of a carhire-quotes response (raw API shape). */
export interface QuotesFilter {
  readonly filter_type: string;
  readonly string_value_filter?: {
    readonly options?: QuotesFilterOption[];
  };
}

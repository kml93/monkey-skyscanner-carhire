/** One option of a carhire-quotes response filter (raw API shape). */
export interface QuotesFilterOption {
  readonly id: string | number;
  readonly display_text?: string;
  readonly price_range?: {
    readonly min: number | null;
  };
}

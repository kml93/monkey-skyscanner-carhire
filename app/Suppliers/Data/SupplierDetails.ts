/** Supplier facts captured from a carhire-quotes response. */
export interface SupplierDetails {
  /** Skyscanner internal numeric ID (e.g. "2091"). */
  readonly id: string;
  /** Display name (e.g. "Eren Rent a Car"). */
  readonly name: string;
  /** Lowest quote price, null when the API gives none. */
  readonly minPrice: number | null;
}

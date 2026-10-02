import type { SupplierDetails } from './SupplierDetails';
import type { SupplierStatus } from './SupplierStatus';

/** Stored supplier: captured details plus the user's choice. */
export interface SupplierEntry extends SupplierDetails {
  readonly status: SupplierStatus;
}

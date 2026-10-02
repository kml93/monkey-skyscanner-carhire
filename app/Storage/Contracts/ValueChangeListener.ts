/**
 * Called after a stored value changed. `remote` is true when another tab wrote it.
 */
export type ValueChangeListener = (remote: boolean) => void;

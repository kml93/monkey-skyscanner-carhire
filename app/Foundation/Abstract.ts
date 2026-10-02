/**
 * Container key: the class (concrete or abstract contract) a binding resolves to.
 */
export type Abstract<T> = abstract new (...args: never[]) => T;

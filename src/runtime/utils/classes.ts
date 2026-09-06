type ClassValue = string | { [key: string]: ClassValue | null };

/**
 * Widens string literals back to `string`, keeping the object's shape. Without
 * it the inferred `T` pins each default to its exact class string, and a `ui`
 * override — the whole point of the prop — fails to type-check.
 */
type Widen<T> = T extends string
    ? string
    : T extends null
      ? null
      : T extends Array<infer U>
        ? Array<Widen<U>>
        : { [K in keyof T]: Widen<T[K]> };

export default function <T extends ClassValue | Array<ClassValue>>(classes: T): Widen<T> {
    return classes as unknown as Widen<T>;
}
import type { Messages } from "#rform/types/locales";

/**
 * What `tr` accepts at runtime, before the generated `TrInput` narrows it. A
 * number as `params` is the plural choice — the same thing vue-i18n's
 * `t(key, 3)` means.
 */
export type TrParams = Record<string, unknown> | number;

export type TrRef = { key: string; params?: TrParams };

export type TrValue = string | TrRef;

export type Tr = (input: TrValue | null | undefined) => string;

/**
 * The one entry shape both engines read. Lives here, and not next to `tr`,
 * because both engines import it and `utils/tr.ts` imports the engines — the
 * other direction would close a cycle.
 */
export const normalize = (
    input: TrValue | null | undefined
): { key: string; params?: TrParams } => {
    if (input === null || input === undefined) {
        return { key: "" };
    }

    if (typeof input === "string") {
        return { key: input };
    }

    return input.params === undefined
        ? { key: input.key }
        : { key: input.key, params: input.params };
};

/**
 * `"pt"` -> `"pt-BR"`, `"en-GB"` -> `"en"`. Exact first (case-insensitively),
 * then the bare language, then any region of it.
 */
export const matchLocale = (
    code: string | null | undefined,
    available: readonly string[]
): string | undefined => {
    if (!code) {
        return undefined;
    }

    const wanted = code.toLowerCase();
    const exact = available.find((entry) => entry.toLowerCase() === wanted);

    if (exact) {
        return exact;
    }

    const primary = wanted.split("-")[0] ?? wanted;

    return (
        available.find((entry) => entry.toLowerCase() === primary) ??
        available.find((entry) => entry.toLowerCase().split("-")[0] === primary)
    );
};

/**
 * Deliberately not the shared `DeepPartial` from `#rform/types`: that module
 * reaches `types/presets.d.ts`, which reads every preset back, and a preset
 * reaches `resolveRule` — which imports this file. Keeping the only type edge
 * on `#rform/types/locales` keeps that loop from closing.
 */
type PartialMessages<T> = {
    [K in keyof T]?: T[K] extends string ? T[K] : PartialMessages<T[K]>;
};

/** Authoring helper for `app/rform/locales/<code>.ts`. Partial by design. */
export const defineLocale = <const T extends PartialMessages<Messages>>(messages: T): T => messages;

/**
 * A named object can also choose a plural form: the built-in `min`/`max`
 * messages interpolate the very number that picks singular from plural, and
 * repeating it at every call site would be noise. The first numeric value in
 * the object is the choice.
 *
 * Without one, both engines stay on branch 0 — `"a | b"` would always read
 * `a`, which is exactly the bug this replaces.
 */
export const pluralOf = (named: Record<string, unknown>): number | undefined =>
    Object.values(named).find((value): value is number => typeof value === "number");

export default {
    defineLocale,
    matchLocale,
    normalize,
    pluralOf
};
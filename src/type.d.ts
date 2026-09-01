import type { Rule } from "#rform/types/presets";

/**
 * `default` is optional so that `defineDefaults` types a Utils component too —
 * a Label or an Error has a `ui` but no model of its own, and a second helper
 * just for them would mean two conventions for the same job.
 */
export interface Base {
    ui: Record<string, unknown> | string
    default?: unknown
}

export type ConvertNeverToUnknown<T>
    = T extends never[] ? unknown[]
        : T extends never ? unknown
            : T extends Array<infer U> ? Array<ConvertNeverToUnknown<U>>
                : T extends object ? {
                    [K in keyof T]: ConvertNeverToUnknown<T[K]>
                } : T;

/**
 * What a named schema slot receives from RForm / RDynamic. Typed here so the
 * scope survives the hop through the dynamic `#[slotName]` bindings.
 */
export type SlotScope = {
    fieldName: string | number
    rule?: Rule
};

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Record<unknown, unknown> ? DeepPartial<T[P]> : T[P];
};

/**
 * The inverse of DeepPartial. What a partial `ui` becomes once merged over a
 * complete set of defaults: every key is present, at every depth.
 */
export type DeepRequired<T> = T extends object
    ? { [P in keyof T]-?: DeepRequired<NonNullable<T[P]>> }
    : T;

/**
 * `C` is the field type the component maps to ("text", "color", ...). It filters
 * which rule presets the `rule` prop accepts, via each preset's `available`.
 */
export type Element <
    OBJ extends Base = Base,
    C = any,
    D = ConvertNeverToUnknown<OBJ["default"]>
> = {
    name?: string | number
    error?: string
    required?: boolean
    rule?: Rule<C>
    loading?: boolean
    default?: D
    ui?: DeepPartial<OBJ["ui"]>
    modelValue?: D
    "onUpdate:modelValue"?: <T extends D>($event: T) => void
};
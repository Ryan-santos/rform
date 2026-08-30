import type { Rule } from "#rform/types/presets";

export interface Base {
    ui: Record<string, unknown> | string
    default: unknown
};

export type ConvertNeverToUnknown<T>
    = T extends never[] ? unknown[]
        : T extends never ? unknown
            : T extends Array<infer U> ? Array<ConvertNeverToUnknown<U>>
                : T extends object ? {
                    [K in keyof T]: ConvertNeverToUnknown<T[K]>
                } : T;

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Record<unknown, unknown> ? DeepPartial<T[P]> : T[P];
};

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
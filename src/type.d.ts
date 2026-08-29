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

export type Element <
    OBJ extends Base = Base,
    D = ConvertNeverToUnknown<OBJ["default"]>
> = {
    name?: string | number
    error?: string
    required?: boolean
    rule?: ((value: T) => string | Promise<string | void> | void)
    loading?: boolean
    default?: D
    ui?: DeepPartial<OBJ["ui"]>
    modelValue?: D
    "onUpdate:modelValue"?: <T extends D>($event: T) => void
};
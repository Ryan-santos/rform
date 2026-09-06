import type { Rule } from "#rform/types/presets";
import type { TrInput } from "#rform/types/tr";

export type { TrInput };

/**
 * `default` is optional so that `defineDefaults` types a Utils component too —
 * a Label or an Error has a `ui` but no model of its own, and a second helper
 * just for them would mean two conventions for the same job.
 *
 * `text` is the third reserved key, and it stays a **nested object** all the way
 * through: what is inside it is a translation key of the module, which the
 * composables prefix with `rform.fields.<component>.` (or `rform.utils.<name>.`)
 * and hand back under the same shape, so a template reads `tr(props.text.add)`.
 *
 * Everything outside `text` is left alone — `keyValue: "id"` is a property
 * name, not a message. The two exceptions are `label` and `placeholder`, which
 * live at the top level by contract (an app passes them directly) but are still
 * prefixed when the value came from the component's own defaults.
 */
export interface Base {
    ui: Record<string, unknown> | string;
    default?: unknown;
    text?: TextSource;
    label?: unknown;
    placeholder?: unknown;
}

/** The authoring shape of `defaults.text`: nested groups of message keys. */
export interface TextSource {
    [key: string]: string | TextSource;
}

export type ConvertNeverToUnknown<T> = T extends never[]
    ? unknown[]
    : T extends never
      ? unknown
      : T extends Array<infer U>
        ? Array<ConvertNeverToUnknown<U>>
        : T extends object
          ? {
                [K in keyof T]: ConvertNeverToUnknown<T[K]>;
            }
          : T;

/**
 * What a named schema slot receives from RForm / RDynamic. Typed here so the
 * scope survives the hop through the dynamic `#[slotName]` bindings.
 */
export type SlotScope = {
    fieldName: string | number;
    rule?: Rule;
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
 * Mirrors a `defaults.text` tree into the prop that carries it, turning every
 * leaf into a `TrInput` the app may override and every level optional:
 *
 * ```ts
 * TextProp<{ hint: string, teste: { a: string } }>
 * // -> { text?: { hint?: TrInput, teste?: { a?: TrInput } } }
 * ```
 *
 * A component writes `TextProp<typeof defaults.text>` and stops restating its
 * own keys. Deliberately a **mapped** type and not a conditional one at the
 * prop level: `@vue/compiler-sfc` derives runtime props from `Props`, and it
 * cannot resolve a `TSConditionalType` that decides whether a prop exists —
 * it fails with "Unresolvable type" and the whole SFC stops collecting.
 * Here `text` always exists; only its interior is mapped.
 */
export type TextTree<T> = {
    [K in keyof T]?: T[K] extends string ? TrInput : TextTree<T[K]>;
};

export type TextProp<T> = {
    text?: TextTree<T>;
};

/**
 * The same component seen from its own `defaults` instead of from the call
 * site. Everything matches its `Props` except `text`, which still holds the raw
 * key suffixes `prefixText` has yet to expand — `"start"`, not a `TrInput`. In
 * an app with `@nuxtjs/i18n` those two are genuinely different types (`TrInput`
 * narrows to `ModuleKey | Literal` there), so a util handing its `defaults` to
 * `useUtil<Props>` has to say which of the two it is holding.
 */
export type WithTextSource<P> = Omit<P, "text"> & { text?: TextSource };

/**
 * `C` is the field type the component maps to ("text", "color", ...). It filters
 * which rule presets the `rule` prop accepts, via each preset's `available`.
 *
 * `text` is deliberately absent here: a component splices it in itself with
 * `TextProp<typeof defaults.text>`, because only the component knows the tree.
 */
export type Element<OBJ extends Base = Base, C = any, D = ConvertNeverToUnknown<OBJ["default"]>> = {
    name?: string | number;
    error?: string;
    required?: boolean;
    rule?: Rule<C>;
    loading?: boolean;
    default?: D;
    ui?: DeepPartial<OBJ["ui"]>;
    modelValue?: D;
    "onUpdate:modelValue"?: <T extends D>($event: T) => void;
};
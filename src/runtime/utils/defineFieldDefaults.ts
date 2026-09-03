import type Components from "#rform/types/components";
import type { DeepPartial } from "../../type";

/**
 * A util contributes presentation, not content. Narrowing its entry to `ui`
 * makes that the contract instead of an accident: the fields decide whether to
 * mount `RUtilsLabel` at all by reading their own `label`, and a default that
 * could conjure a label out of `Utils` would make that decision wrong. The
 * built-in utils already declared those keys empty, so nothing that worked
 * stops working.
 */
type UtilDefaults<U> = {
    [K in keyof U]?: U[K] extends { ui?: infer _ } ? Pick<DeepPartial<U[K]>, "ui"> : never
};

type FieldDefaults = DeepPartial<Omit<Components, "Utils">> & {
    Utils?: UtilDefaults<Components["Utils"]>
};

/**
 * Types `app/rform/defaults.ts` — the user's overrides for what every component
 * declares in its own `defaults`, keyed by component name:
 *
 * ```ts
 * export default defineFieldDefaults({
 *     Text: { default: "", ui: { container: "gap-2" } },
 *     Utils: { Placeholder: { ui: { default: "text-xs" } } }
 * });
 * ```
 *
 * They sit between the component's defaults and the props passed at the call
 * site, so a prop on the field always wins.
 */
export default function <const T extends FieldDefaults> (defaults: T) {
    return defaults;
}

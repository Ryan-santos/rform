import type Components from "#rform/types/components";
import type { DeepPartial } from "../../type";

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
export default function <const T extends DeepPartial<Components>> (defaults: T) {
    return defaults;
}

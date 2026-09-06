import type Components from "#rform/types/components";

import type { DeepPartial } from "../../type";

/**
 * Um util contribui apresentação, não conteúdo — daí a entrada dele ficar restrita
 * a `ui`. Os campos decidem montar `RUtilsLabel` lendo o próprio `label`, e um
 * default capaz de inventar label pelo `Utils` tornaria essa decisão errada.
 */
type UtilDefaults<U> = {
    [K in keyof U]?: U[K] extends { ui?: infer _ } ? Pick<DeepPartial<U[K]>, "ui"> : never;
};

type FieldDefaults = DeepPartial<Omit<Components, "Utils">> & {
    Utils?: UtilDefaults<Components["Utils"]>;
};

/**
 * Tipa o `app/rform/defaults.ts` — os overrides do app sobre o `defaults` que cada
 * componente declara, chaveados por nome. Entram entre o `defaults` do componente
 * e as props do call site, então prop no campo sempre ganha.
 *
 * @example
 * export default defineFieldDefaults({
 *     Text: { default: "", ui: { container: "gap-2" } },
 *     Utils: { Placeholder: { ui: { default: "text-xs" } } }
 * });
 */
export default function <const T extends FieldDefaults>(defaults: T) {
    return defaults;
}
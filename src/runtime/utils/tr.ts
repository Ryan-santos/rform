import { tr as engine } from "#rform/translate";

import type { Tr, TrParams } from "./i18n";

/** What a rule preset names: the path **after** `rform.presets.rules.`. */
export type RuleMessage = { key: string; params?: TrParams };

/**
 * The whole translator, by full path. A component gets the same function from
 * `useInjection` / `useUtilProps` — this export is for the two places that
 * cannot call a composable: a rule preset, and a module component reaching for
 * a shared key like `tr("rform.formats.date")`.
 */
export const tr: Tr = (input) => engine(input);

/**
 * A rule is not a component, so it cannot call a composable — and the context
 * is no longer the channel either. An imported helper solves the same problem
 * without occupying it.
 *
 * `trRule({ key: "min.number", params: { min } })`
 *   -> `tr({ key: "rform.presets.rules.min.number", params: { min } })`
 */
export const trRule = (ref: string | RuleMessage): string => {
    const { key, params } = typeof ref === "string" ? { key: ref, params: undefined } : ref;

    return tr({ key: `rform.presets.rules.${key}`, params });
};

export default { tr, trRule };
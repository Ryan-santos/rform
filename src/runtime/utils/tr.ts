import { tr as engine } from "#rform/translate";

import type { Tr, TrParams } from "./i18n";

/** O que uma rule nomeia: o caminho **depois** de `rform.presets.rules.`. */
export type RuleMessage = { key: string; params?: TrParams };

/**
 * O tradutor inteiro, por caminho completo. Um componente ganha a mesma função de
 * `useField` / `useUtil`; este export serve aos dois lugares que não podem chamar
 * composable: uma rule, e um componente buscando chave compartilhada.
 *
 * @example tr("rform.formats.date")
 */
export const tr: Tr = (input) => engine(input);

/**
 * Açúcar do `tr` para rule, que prefixa `rform.presets.rules.` — é assim que a
 * rule alcança o locale ativo sem receber tradutor no contexto.
 *
 * @example trRule({ key: "min.number", params: { min } })
 */
export const trRule = (ref: string | RuleMessage): string => {
    const { key, params } = typeof ref === "string" ? { key: ref, params: undefined } : ref;

    return tr({ key: `rform.presets.rules.${key}`, params });
};

export default { tr, trRule };
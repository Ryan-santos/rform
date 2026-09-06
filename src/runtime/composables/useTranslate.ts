import type { Ref } from "vue";

import { useTr } from "#rform/translate";

import type { Tr } from "../utils/i18n";

/**
 * `{ tr, locale }` para campo e util — `useField` e `useUtil` chamam, então nenhum
 * componente escreve o import. Qual motor responde é decisão de build time, pelo
 * alias exato `#rform/translate`; ver "i18n" no `.claude/CLAUDE.md`.
 *
 * O `tr` lê `locale.value` a cada chamada, então uma chamada em template rastreia o
 * ref e trocar de idioma re-renderiza.
 */
export default function useTranslate(): { tr: Tr; locale: Ref<string> } {
    return useTr();
}
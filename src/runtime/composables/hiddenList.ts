import { inject, provide, shallowRef, type InjectionKey, type ShallowRef } from "vue";

type HiddenList = ShallowRef<Set<string>>;

const hiddenListKey: InjectionKey<HiddenList> = Symbol("hidden-list");

/**
 * Abre o registro dos campos escondidos por `visibleWhen`, chaveado pelo mesmo `id`
 * pontilhado do `rulesList`. O Form o lê uma vez no fim do `validate()` para filtrar
 * as três fontes de mensagem de uma vez. Ver "Condicionais no schema" no
 * `.claude/CLAUDE.md`.
 */
export function defineHiddenList(): HiddenList {
    // `shallowRef` mutado no lugar, como o `Map` do `rulesList`: só há leitura
    // imperativa, dentro do `validate()`.
    const hiddenList = shallowRef<Set<string>>(new Set());
    provide(hiddenListKey, hiddenList);
    return hiddenList;
}

/** O registro do Form ancestral, ou `undefined` num campo usado solto. */
export function injectHiddenList(): HiddenList | undefined {
    return inject<HiddenList | undefined>(hiddenListKey, undefined);
}

export default { defineHiddenList, injectHiddenList };
import { inject, provide, shallowRef, type InjectionKey, type ShallowRef } from "vue";

type Entry = () => Promise<string | void>;

type PendingList = ShallowRef<Map<string, Entry>>;

const pendingListKey: InjectionKey<PendingList> = Symbol("pending-list");

/**
 * Abre o registro do que o Form precisa **esperar** antes de validar, chaveado pelo
 * mesmo `id` pontilhado do `rulesList`. Espelho dele, e com a mesma regra: a entrada
 * resolve na *liquidação* e devolve a mensagem, nunca rejeita — quem a escreve é o
 * `errorsBag`. Ver "O gancho de pendência no `RForm`" no `.claude/CLAUDE.md`.
 */
export function definePendingList(): PendingList {
    const pendingList = shallowRef<Map<string, Entry>>(new Map());
    provide(pendingListKey, pendingList);
    return pendingList;
}

/** O registro do Form ancestral, ou `undefined` num campo usado solto. */
export function injectPendingList(): PendingList | undefined {
    return inject<PendingList | undefined>(pendingListKey, undefined);
}

export default { definePendingList, injectPendingList };
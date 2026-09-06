import { inject, provide, shallowRef, type InjectionKey, type ShallowRef } from "vue";

type Entry = () => Promise<string | void>;

type RulesList = ShallowRef<Map<string, Entry>>;

const rulesListKey: InjectionKey<RulesList> = Symbol("rules-list");

/**
 * Abre o registro de validações do Form, chaveado por `name` do campo. A entrada
 * **devolve** a mensagem — quem a escreve no campo é o `errorsBag`, que é o único
 * escritor do `error`. Ver "O `errorsBag`" no `.claude/CLAUDE.md`.
 */
export function defineRulesList(): RulesList {
    const rulesList = shallowRef<Map<string, Entry>>(new Map());
    provide(rulesListKey, rulesList);
    return rulesList;
}

/** O registro do Form ancestral, ou `undefined` num campo usado solto. */
export function injectRulesList(): RulesList | undefined {
    return inject<RulesList | undefined>(rulesListKey, undefined);
}

export default { defineRulesList, injectRulesList };
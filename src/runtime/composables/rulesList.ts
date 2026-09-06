import { inject, provide, shallowRef, type InjectionKey, type ShallowRef } from "vue";

type RulesList = ShallowRef<Map<string, () => Promise<void>>>;

const rulesListKey: InjectionKey<RulesList> = Symbol("rules-list");

export function defineRulesList(): RulesList {
    const rulesList = shallowRef<Map<string, () => Promise<void>>>(new Map());
    provide(rulesListKey, rulesList);
    return rulesList;
}

export function injectRulesList(): RulesList | undefined {
    return inject<RulesList | undefined>(rulesListKey, undefined);
}

export default { defineRulesList, injectRulesList };
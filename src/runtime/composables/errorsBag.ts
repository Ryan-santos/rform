import { inject, provide, ref, type InjectionKey, type Ref } from "vue";

type ErrorsBag = Ref<Record<string, string>>;

const errorsBagKey: InjectionKey<ErrorsBag> = Symbol("errors-bag");

/**
 * Abre o mapa de erros do Form, chaveado pelo mesmo `id` pontilhado do
 * `rulesList` — e é o **único** escritor do `error` de um campo. Ver
 * "O `errorsBag`" no `.claude/CLAUDE.md`.
 */
export function defineErrorsBag(): ErrorsBag {
    // `ref`, não `shallowRef`: o campo apaga a própria chave com `delete`, e isso
    // precisa ser reativo.
    const errors = ref<Record<string, string>>({});
    provide(errorsBagKey, errors);
    return errors;
}

/** O mapa do Form ancestral, ou `undefined` num campo usado solto. */
export function injectErrorsBag(): ErrorsBag | undefined {
    return inject<ErrorsBag | undefined>(errorsBagKey, undefined);
}

export default { defineErrorsBag, injectErrorsBag };
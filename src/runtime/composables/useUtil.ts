import { computed, inject, type ComputedRef, type Ref } from "vue";

import userDefaults from "#rform/defaults";
import { utils as registry, hooks } from "#rform/registry";
import type { DeepRequired, Element, WithTextSource } from "#rform/types";
import type Utils from "#rform/types/components/utils";
import { hookUi, merger, prefixText } from "#rform/utils";

import type { Tr } from "../utils/i18n";
import type { ValueProp } from "./useField";
import { keyProp } from "./useField";
import useTranslate from "./useTranslate";

/**
 * O que um util de fato recebe: as props `Element` do campo pai, as próprias, e um
 * `ui` mesclado sobre os defaults completos — então toda chave de `ui` existe, que
 * é o que os templates já assumem.
 */
export type UtilProps<P> = Omit<Element & P, "ui"> & {
    ui: DeepRequired<NonNullable<P extends { ui?: infer U } ? U : never>>;
};

export type UtilContext<P extends Record<string, unknown>> = {
    props: ComputedRef<UtilProps<P>>;
    upper: ValueProp<P>;
    tr: Tr;
    locale: Ref<string>;
};

const assertName: (name?: keyof Utils) => asserts name is keyof Utils = (name) => {
    // Sem fallback: cair no nome de outro componente renderiza com os defaults
    // errados e nunca diz nada.
    if (!name || !(name in registry)) {
        throw new Error(
            `[rform] useUtil could not resolve a component name${name ? ` (got "${name}")` : ""}. A util has to live in the module's own components/utils directory or in app/rform/utils for the build to inject it.`
        );
    }
};

const build = <P extends Record<string, unknown>>(
    upper: ValueProp<P>,
    overrides: P,
    defaults: P,
    componentName: keyof Utils,
    translate: Pick<UtilContext<P>, "tr" | "locale">
): UtilContext<P> => {
    // Uma vez, fora do computed: o `prefixText` copia, e o objeto `defaults` do
    // componente é compartilhado por todas as instâncias.
    const prefixed = prefixText(defaults, componentName, "utils") as P;

    const props = computed((): UtilProps<P> => {
        const { ui, ...rest } = upper.props.value;

        const utilUi = typeof ui === "object" ? (ui?.Utils as Utils) : undefined;

        const merged = merger(prefixed, overrides, {
            ...rest,
            ui: utilUi?.[componentName] as P["ui"]
        });

        return {
            ...merged,
            ui: hookUi(merged.ui as UtilProps<P>["ui"], hooks.utils[componentName])
        } as unknown as UtilProps<P>;
    });

    return {
        props,
        upper,
        ...translate
    };
};

/**
 * A composable de todo util: devolve `{ props, upper, tr, locale }`. Passar o
 * `defaults` do componente mantém a chamada síncrona — ver "useUtil" no
 * `.claude/CLAUDE.md`; a forma sem argumento resolve pelo registry e é async.
 *
 * @example const { props, upper, tr } = useUtil<Props>(defaults);
 */
export default function useUtil<P extends Record<string, unknown>>(
    defaults: WithTextSource<P>,
    componentName?: keyof Utils
): UtilContext<P>;

export default function useUtil<P extends Record<string, unknown>>(
    defaults?: undefined,
    componentName?: keyof Utils
): Promise<UtilContext<P>>;

export default function useUtil<P extends Record<string, unknown>>(
    defaults?: WithTextSource<P>,
    /** Injetado pelo vite plugin, a partir do nome do arquivo do componente. */
    componentName?: keyof Utils
): UtilContext<P> | Promise<UtilContext<P>> {
    assertName(componentName);

    // As três leituras antes de qualquer `await`: precisam da instância ainda
    // corrente (ver "useUtil" no `.claude/CLAUDE.md`).
    const upper = inject<ValueProp<P>>(keyProp, {} as ValueProp<P>);
    const overrides = userDefaults.Utils?.[componentName] as P;
    const translate = useTranslate();

    if (defaults) {
        // O `prefixText` é o que transforma os sufixos crus em chaves, e é do outro
        // lado dele que as duas formas se encontram.
        return build(upper, overrides, defaults as P, componentName, translate);
    }

    const load = registry[componentName as keyof typeof registry] as unknown as () => Promise<{
        defaults?: P;
    }>;

    return load().then((mod) =>
        build(upper, overrides, (mod?.defaults ?? {}) as P, componentName, translate)
    );
}
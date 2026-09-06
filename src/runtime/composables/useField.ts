import {
    computed,
    inject,
    provide,
    ref,
    shallowRef,
    useModel,
    watch,
    type ComputedRef,
    type InjectionKey,
    type ModelRef
} from "vue";

import userDefaults from "#rform/defaults";
import { components as registry, hooks } from "#rform/registry";
import type { Element } from "#rform/types";
import type Components from "#rform/types/components";
import { hookUi, merger, prefixText, resolveMask, resolveRule } from "#rform/utils";

import { injectFormRoot } from "./formRoot";
import { injectRulesList } from "./rulesList";
import useTranslate from "./useTranslate";

type Obj = Record<NonNullable<Element["name"]>, unknown>;

export type Value = {
    id: string | null;
    model: ModelRef<Array<unknown> | Obj | undefined>;
};

export const key = Symbol() as InjectionKey<Value>;

export type ValueProp<T extends object = object> = {
    id: string | null;
    props: ComputedRef<Element & T>;
    model: ModelRef<unknown>;
};

export const keyProp = Symbol() as InjectionKey<ValueProp>;

/**
 * A composable de todo campo: resolve props, model, máscara, validação e tradução.
 * Havendo Form pai e `props.name`, o model lê e escreve direto em
 * `upper.model.value[name]`. Ver "useField" no `.claude/CLAUDE.md`.
 *
 * @example const { id, model, props, tr } = await useField(_props);
 */
export default async function <T extends Element, S = T["modelValue"], G = T["modelValue"]>(
    sourceProps: T,
    opts?: {
        set?: (value: T["modelValue"]) => S;
        get?: (value: T["modelValue"]) => G;
    },
    /** Injetado pelo vite plugin, a partir do nome do arquivo do componente. */
    componentName?: keyof Components
) {
    // Sem fallback: cair no nome de outro componente renderiza o campo com os
    // defaults errados e nunca diz nada.
    if (!componentName || !(componentName in registry)) {
        throw new Error(
            `[rform] useField could not resolve a component name${componentName ? ` (got "${componentName}")` : ""}. A field has to live in the module's own components directory or in app/rform/fields for the build to inject it.`
        );
    }

    // Todo campo ganha `tr` e `locale` sem escrever import, inclusive um campo do
    // usuário em `app/rform/fields`.
    const { tr, locale } = useTranslate();

    const defaults = shallowRef<Element>({});
    const overrides = userDefaults[componentName];

    const localProps = ref<Element>({
        error: undefined
    });

    // Ausente em `Form` e `Dynamic`: o mapa gerado só lista o que saiu de um
    // diretório `fields`.
    const hook = (hooks.fields as Record<string, string | undefined>)[componentName];

    const props = computed(() => {
        const merged = merger(defaults.value, overrides, localProps.value, sourceProps);

        merged.ui = hookUi(merged.ui, hook) as typeof merged.ui;

        return merged;
    });

    const upper = inject(key, undefined);

    const cloneDefault = (): unknown => {
        const def = props.value.default;
        if (def !== null && typeof def === "object") {
            return structuredClone(def);
        }
        return def;
    };

    // `sourceProps`, não `props.value`: o snapshot do merger não é rastreável e o
    // `localValue` congelaria (ver "useField" no `.claude/CLAUDE.md`).
    const model = useModel(sourceProps, "modelValue", {
        set(value): S {
            localProps.value.error = undefined;
            value = opts?.set?.(value) ?? value ?? cloneDefault();

            if (
                upper?.model?.value &&
                typeof upper.model.value === "object" &&
                props.value?.name !== undefined
            ) {
                (upper.model.value as Obj)[props.value.name] = value;
            }

            return value as S;
        },
        // O fallback clona: entregar o `default` cru deixava um filho poluir o objeto
        // que o componente declarou (ver "useField" no `.claude/CLAUDE.md`).
        get(value): G {
            if (upper?.model && props.value?.name !== undefined) {
                const accessor = upper.model.value as Obj;
                const get = accessor?.[props.value.name] ?? cloneDefault();
                return (opts?.get?.(get) ?? get) as G;
            }

            const get = value ?? cloneDefault();
            return (opts?.get?.(get) ?? get) as G;
        }
    });

    const currentValue = () => {
        if (upper?.model && props.value?.name !== undefined) {
            return (upper.model.value as Obj | undefined)?.[props.value.name];
        }
        return props.value.modelValue;
    };

    const seed = () => {
        if (upper?.model && props.value?.name !== undefined) {
            const acc = upper.model.value;

            if (!acc || typeof acc !== "object") {
                return;
            }

            // Índice além do fim = array que acabou de encolher; semear ali
            // ressuscitaria o slot (ver "useField" no `.claude/CLAUDE.md`).
            if (Array.isArray(acc) && Number(props.value.name) >= acc.length) {
                return;
            }

            (acc as Obj)[props.value.name] = cloneDefault();
            return;
        }
        model.value = cloneDefault();
    };

    watch(
        currentValue,
        (current) => {
            if (current === undefined) {
                seed();
            }
        },
        { immediate: true, flush: "sync" }
    );

    const upperId = upper?.id ? `${upper.id}.` : "";
    const id = props.value.name !== undefined ? `${upperId}${props.value.name}` : null;

    provide(keyProp, {
        id,
        props,
        model
    });

    const rulesList = injectRulesList();
    const formRoot = injectFormRoot();

    const field = componentName.toLowerCase();

    // Import dinâmico para manter zod fora do caminho crítico de uma página sem
    // validação (ver "useField" no `.claude/CLAUDE.md`).
    const presets = shallowRef<typeof import("#rform/presets") | undefined>();

    const loadPresets = async () => {
        presets.value ??= await import("#rform/presets");
        return presets.value;
    };

    const declaresPreset = () => {
        const current = props.value as { mask?: unknown; rule?: unknown };
        return current.mask !== undefined || current.rule !== undefined;
    };

    if (declaresPreset()) {
        await loadPresets();
    }

    const mask = computed(() =>
        resolveMask(
            (props.value as { mask?: Parameters<typeof resolveMask>[0] }).mask,
            presets.value?.masks ?? {}
        )
    );

    watch(
        () => props.value.rule,
        async (rule) => {
            if (!id) {
                return;
            }

            const loaded = rule === undefined ? presets.value : await loadPresets();

            const validate = resolveRule(rule, loaded?.rules ?? {}, field);

            if (validate) {
                const fn = async () => {
                    try {
                        localProps.value.loading = true;

                        const error = await validate(model.value, formRoot?.value);

                        if (error) {
                            localProps.value.error = error;
                            throw new Error(error);
                        }
                    } finally {
                        localProps.value.loading = undefined;
                    }
                };

                rulesList?.value?.set(id, fn);
            } else {
                localProps.value.error = undefined;
                rulesList?.value?.delete(id);
            }
        },
        {
            immediate: true
        }
    );

    // Pelo registry gerado, não por import dinâmico relativo: este compila num glob
    // ancorado neste arquivo, do qual `app/rform/fields` não faz parte.
    const load = registry[componentName as keyof typeof registry] as () => Promise<{
        defaults?: Element;
    }>;

    // Prefixado **antes** do merger: é o que dá procedência de graça ao texto.
    defaults.value = prefixText((await load())?.defaults ?? {}, componentName, "fields") as Element;

    // O watch acima já rodou, mas com `defaults.value` ainda vazio — e ele não se
    // corrige sozinho: a fonte foi de `undefined` a `undefined`, que não é mudança.
    if (currentValue() === undefined) {
        seed();
    }

    return {
        id,
        upper,
        model,
        mask,
        props,
        tr,
        locale
    };
}
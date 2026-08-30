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

import type { Element } from "#rform/types";
import type Components from "#rform/types/components";
import { merger, resolveMask, resolveRule } from "#rform/utils";
import { masks, rules } from "#rform/presets";
import userDefaults from "#rform/defaults";
import { injectFormRoot } from "./formRoot";
import { injectRulesList } from "./rulesList";

type Obj = Record<NonNullable<Element["name"]>, unknown>;

export type Value = {
    id: string | null
    model: ModelRef<Array<unknown> | Obj | undefined>
};

export const key = Symbol() as InjectionKey<Value>;

export type ValueProp <T extends object = object> = {
    id: string | null
    props: ComputedRef<Element & T>
    model: ModelRef<unknown>
};

export const keyProp = Symbol() as InjectionKey<ValueProp>;

export default async function <
    T extends Element,
    S = T["modelValue"],
    G = T["modelValue"]
> (
    sourceProps: T,
    opts?: {
        set?: (value: T["modelValue"]) => S
        get?: (value: T["modelValue"]) => G
    },
    /**
     * Defined by vite
     */
    componentName: keyof Components = "Text"
) {
    const defaults = shallowRef<Element>({});
    const overrides = userDefaults[componentName];

    const localProps = ref<Element>({
        error: undefined
    });

    const props = computed(() => merger(
        defaults.value,
        overrides,
        localProps.value,
        sourceProps
    ));

    const upper = inject(key, undefined);

    const model = useModel(props.value, "modelValue", {
        set (value): S {
            localProps.value.error = undefined;
            value = opts?.set?.(value) ?? value ?? props.value.default;

            if (
                upper?.model?.value
                && typeof upper.model.value === "object"
                && props.value?.name !== undefined
            ) {
                (upper.model.value as Obj)[props.value.name] = value;
            }

            return (value as S);
        },
        get (value): G {
            if (
                upper?.model
                && props.value?.name !== undefined
            ) {
                const accessor = upper.model.value as Obj;
                const get = accessor?.[props.value.name] ?? props.value.default;
                return (opts?.get?.(get) ?? get) as G;
            }

            return (opts?.get?.(value ?? props.value.default) ?? value ?? props.value.default) as G;
        }
    });

    const cloneDefault = (): unknown => {
        const def = props.value.default;
        if (def !== null && typeof def === "object") {
            return structuredClone(def);
        }
        return def;
    };

    watch(
        () => {
            if (upper?.model && props.value?.name !== undefined) {
                return (upper.model.value as Obj | undefined)?.[props.value.name];
            }
            return props.value.modelValue;
        },
        (current) => {
            if (current !== undefined) {
                return;
            }
            if (upper?.model && props.value?.name !== undefined) {
                const acc = upper.model.value;
                if (acc && typeof acc === "object") {
                    (acc as Obj)[props.value.name] = cloneDefault();
                }
            }
            else {
                model.value = cloneDefault();
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

    const mask = computed(() =>
        resolveMask((props.value as { mask?: Parameters<typeof resolveMask>[0] }).mask, masks));

    watch(() => props.value.rule, (rule) => {
        if (!id) {
            return;
        }

        const validate = resolveRule(rule, rules, field);

        if (validate) {
            const fn = async () => {
                try {
                    localProps.value.loading = true;

                    const error = await validate(model.value, formRoot?.value);

                    if (error) {
                        localProps.value.error = error;
                        throw new Error(error);
                    }
                }
                finally {
                    localProps.value.loading = undefined;
                }
            };

            rulesList?.value?.set(id, fn);
        }
        else {
            localProps.value.error = undefined;
            rulesList?.value?.delete(id);
        }
    }, {
        immediate: true
    });

    defaults.value = (await import(`../components/${componentName}.vue`))?.defaults;

    return {
        id,
        upper,
        model,
        mask,
        props
    };
};
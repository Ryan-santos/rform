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
import { components as registry } from "#rform/registry";
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
     * Injected by the vite plugin from the component's own file name.
     */
    componentName?: keyof Components
) {
    // No fallback: defaulting to another component's name renders the field
    // with the wrong defaults and never says so.
    if (!componentName || !(componentName in registry)) {
        throw new Error(
            `[rform] useInjection could not resolve a component name${componentName ? ` (got "${componentName}")` : ""}. A field has to live in the module's own components directory or in app/rform/fields for the build to inject it.`
        );
    }

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

    const cloneDefault = (): unknown => {
        const def = props.value.default;
        if (def !== null && typeof def === "object") {
            return structuredClone(def);
        }
        return def;
    };

    /**
     * `sourceProps`, not `props.value`: the latter is the snapshot the merger
     * returned during setup, a plain object useModel cannot track — its
     * `localValue` would freeze on the initial modelValue and every later
     * change to the bound object (a reset, an async load) would leave the
     * field writing into a detached one.
     */
    const model = useModel(sourceProps, "modelValue", {
        set (value): S {
            localProps.value.error = undefined;
            value = opts?.set?.(value) ?? value ?? cloneDefault();

            if (
                upper?.model?.value
                && typeof upper.model.value === "object"
                && props.value?.name !== undefined
            ) {
                (upper.model.value as Obj)[props.value.name] = value;
            }

            return (value as S);
        },
        /**
         * The fallback clones: `props.value.default` is the very object the
         * component declared at module scope — `merger` copies objects and
         * arrays by reference when the key exists in only one source. Handing
         * it out raw let a child write straight into it (a detached RObject
         * whose index was just spliced away still reads through here), which
         * permanently polluted the default for every later instance in the
         * process. `??` keeps the clone lazy.
         */
        get (value): G {
            if (
                upper?.model
                && props.value?.name !== undefined
            ) {
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

            /**
             * An index past the end means the array just shrank — a splice from
             * the remove button, or a reset that put the empty default back.
             * Seeding there would resurrect the slot: this watcher is
             * `flush: "sync"`, so it still runs before the v-for unmounts the
             * item, and `arr[length] = default` grows the array again.
             */
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

    // Through the generated registry, not a relative dynamic import: the latter
    // compiles to a glob rooted at this file, which `app/rform/fields` is not in.
    const load = registry[componentName as keyof typeof registry] as
        () => Promise<{ defaults?: Element }>;

    defaults.value = (await load())?.defaults ?? {};

    /**
     * The watch above already ran, but back then `defaults.value` was still
     * empty — so a default declared by the component (rather than passed at the
     * call site) seeded as `undefined`. The watch will not catch up on its own:
     * its source went `undefined -> undefined`, which is not a change.
     */
    if (currentValue() === undefined) {
        seed();
    }

    return {
        id,
        upper,
        model,
        mask,
        props
    };
};
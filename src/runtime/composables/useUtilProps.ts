import type Utils from "#rform/types/components/utils";
import type { DeepRequired, Element } from "#rform/types";
import type { ValueProp } from "./useInjection";
import { computed, inject, type ComputedRef } from "vue";
import { keyProp } from "./useInjection";
import userDefaults from "#rform/defaults";
import { utils as registry } from "#rform/registry";
import { merger } from "#rform/utils";

/**
 * What a Utils component actually receives: the parent field's `Element` props,
 * its own props, and a `ui` merged over the complete defaults — so every `ui`
 * key is present, which is what the templates already assume.
 */
export type UtilProps<P> = Omit<Element & P, "ui"> & {
    ui: DeepRequired<NonNullable<P extends { ui?: infer U } ? U : never>>
};

export type UtilContext<P extends Record<string, unknown>> = {
    props: ComputedRef<UtilProps<P>>
    upper: ValueProp<P>
};

const assertName: (name?: keyof Utils) => asserts name is keyof Utils = (name) => {
    // No fallback: defaulting to another component's name renders with the
    // wrong defaults and never says so.
    if (!name || !(name in registry)) {
        throw new Error(
            `[rform] useUtilProps could not resolve a component name${name ? ` (got "${name}")` : ""}. A util has to live in the module's own components/utils directory or in app/rform/utils for the build to inject it.`
        );
    }
};

const build = <P extends Record<string, unknown>> (
    upper: ValueProp<P>,
    overrides: P,
    defaults: P,
    componentName: keyof Utils
): UtilContext<P> => {
    const props = computed((): UtilProps<P> => {
        const {
            ui,
            ...rest
        } = upper.props.value;

        const utilUi = typeof ui === "object" ? (ui?.Utils as Utils) : undefined;

        return merger(
            defaults,
            overrides,
            {
                ...rest,
                ui: utilUi?.[componentName] as P["ui"]
            }
        ) as unknown as UtilProps<P>;
    });

    return {
        props,
        upper
    };
};

/**
 * Handing the component's own `defaults` in keeps this synchronous, which is
 * the point: a field renders six of these, and every `await` in a `setup` turns
 * the component into an async one — a Suspense boundary, a microtask hop before
 * its subtree exists, and all of it paid even by the five utils that decide to
 * render nothing. `<script setup>` shares scope with `<script>`, so the object
 * is already in hand; reaching into the registry for it was a round trip to
 * fetch what the caller was standing on.
 *
 * The no-argument form still resolves through the registry and still returns a
 * promise, because a util written before this existed calls it that way.
 */
export default function useUtilProps<P extends Record<string, unknown>> (
    defaults: P,
    componentName?: keyof Utils
): UtilContext<P>;

export default function useUtilProps<P extends Record<string, unknown>> (
    defaults?: undefined,
    componentName?: keyof Utils
): Promise<UtilContext<P>>;

export default function useUtilProps<P extends Record<string, unknown>> (
    defaults?: P,
    /**
     * Injected by the vite plugin from the component's own file name.
     */
    componentName?: keyof Utils
): UtilContext<P> | Promise<UtilContext<P>> {
    assertName(componentName);

    /**
     * Both reads happen here, before any `await`: `inject` needs the component
     * instance to still be current, and on the legacy path the continuation
     * runs in a microtask, long after Vue has cleared it.
     */
    const upper = inject<ValueProp<P>>(keyProp, {} as ValueProp<P>);
    const overrides = userDefaults.Utils?.[componentName] as P;

    if (defaults) {
        return build(upper, overrides, defaults, componentName);
    }

    const load = registry[componentName as keyof typeof registry] as unknown as
        () => Promise<{ defaults?: P }>;

    return load().then((mod) => build(upper, overrides, (mod?.defaults ?? {}) as P, componentName));
};

import type Utils from "#rform/types/components/utils";
import type { DeepRequired, Element } from "#rform/types";
import type { ValueProp } from "./useInjection";
import { computed, inject } from "vue";
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

export default async function <
    P extends Record<string, unknown> = Record<string, unknown>
> (
    /**
     * Injected by the vite plugin from the component's own file name.
     */
    componentName?: keyof Utils
) {
    // No fallback: defaulting to another component's name renders with the
    // wrong defaults and never says so.
    if (!componentName || !(componentName in registry)) {
        throw new Error(
            `[rform] useUtilProps could not resolve a component name${componentName ? ` (got "${componentName}")` : ""}. A util has to live in the module's own components/utils directory or in app/rform/utils for the build to inject it.`
        );
    }

    const upper = inject<ValueProp<P>>(keyProp, {} as ValueProp<P>);
    const overrides = userDefaults.Utils?.[componentName] as P;

    const load = registry[componentName as keyof typeof registry] as unknown as
        () => Promise<{ defaults?: P }>;

    const defaults = (await load())?.defaults as P;

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
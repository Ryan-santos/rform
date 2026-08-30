import type Utils from "#rform/types/components/utils";
import type { DeepRequired, Element } from "#rform/types";
import type { ValueProp } from "./useInjection";
import { computed, inject } from "vue";
import { keyProp } from "./useInjection";
import { useAppConfig } from "#app";
import { merger } from "#rform/utils";

/**
 * @param componentName Defined by vite
 */
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
    componentName: keyof Utils = "Label"
) {
    const upper = inject<ValueProp<P>>(keyProp, {} as ValueProp<P>);
    const appConfig = useAppConfig()?.rform?.components?.Utils?.[componentName] as P;
    const defaults = (await import(`../components/Utils/${componentName}.vue`))?.defaults as P;

    const props = computed((): UtilProps<P> => {
        const {
            ui,
            ...rest
        } = upper.props.value;

        const utilUi = typeof ui === "object" ? (ui?.Utils as Utils) : undefined;

        return merger(
            defaults,
            appConfig,
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
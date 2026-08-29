import type Utils from "#rform/types/components/utils";
import type { ValueProp } from "./useInjection";
import { computed, inject } from "vue";
import { keyProp } from "./useInjection";
import { useAppConfig } from "#app";
import { merger } from "#rform/utils";

/**
 * @param componentName Defined by vite
 */
export default async function <
    P extends Record<string, unknown> = Record<string, unknown>
> (
    componentName: keyof Utils = "Label"
) {
    const upper = inject<ValueProp<P>>(keyProp, {} as ValueProp<P>);
    const appConfig = useAppConfig()?.rform?.components?.Utils?.[componentName] as P;
    const defaults = (await import(`../components/Utils/${componentName}.vue`))?.defaults as P;

    const props = computed(() => {
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
        );
    });

    return {
        props,
        upper
    };
};
<template>
    <div :class="props.ui?.container">
        <RUtilsLabel />

        <div :class="props.ui?.group?.wrapper?.container">
            <div
                v-if="$slots.leading"
                :class="props.ui?.group?.wrapper?.leading"
            >
                <slot name="leading" />
            </div>

            <div :class="props.ui?.group?.field?.container">
                <RUtilsPlaceholder />
                <input
                    v-model="model"
                    v-maska="props.mask"
                    :name="String(props.name)"
                    type="text"
                    :class="props.ui?.group?.field?.input"
                >
            </div>

            <RUtilsLength />

            <div
                v-if="$slots.trailing"
                :class="props.ui?.group?.wrapper?.trailing"
            >
                <slot name="trailing" />
            </div>

            <RUtilsLoading />
        </div>

        <RUtilsDescription />
        <RUtilsError />
    </div>
</template>

<script lang="ts">
    import type { Element } from "#rform/types";
    import type { MaskInputOptions } from "maska";
    import { defineDefaults } from "#rform/utils";
    import { useInjection } from "#rform/composables";
    import { vMaska } from "maska/vue";
    import type Utils from "#rform/types/components/utils/props";

    export const defaults = defineDefaults({
        ui: {
            container: "flex grow flex-col gap-1",
            group: {
                wrapper: {
                    container: "relative z-0 flex w-full flex-row items-center rounded-xl bg-background-100 outline-2 outline-transparent transition-all duration-300 has-[:focus]:text-primary has-[:focus]:outline-primary",
                    leading: "p-3 pr-0 flex",
                    trailing: "p-3 pl-0 flex"
                },
                field: {
                    container: "grow",
                    input: "w-full rounded-lg bg-transparent outline-none p-3"
                }
            }
        },
        default: ""
    });

    export type Props = Element<typeof defaults>
        & Utils["Description"]
        & Utils["Error"]
        & Utils["Loading"]
        & Utils["Length"]
        & Utils["Placeholder"]
        & {
            mask?: MaskInputOptions | string
        };
</script>

<script setup lang="ts">
    const _props = withDefaults(defineProps<Props>(), {
        required: undefined,
        loading: undefined
    });

    const {
        model,
        props
    } = await useInjection(_props);
</script>
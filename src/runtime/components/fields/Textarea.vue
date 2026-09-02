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
                <textarea
                    v-model="model"
                    v-mask="mask"
                    :name="String(props.name)"
                    :rows="props.rows"
                    :class="props.ui?.group?.field?.textarea"
                />
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
    import type { Mask } from "#rform/types/presets";
    import { defineDefaults } from "#rform/utils";
    import { useInjection } from "#rform/composables";
    import { vMask } from "#rform/utils";
    import type Utils from "#rform/types/components/utils/props";

    export const defaults = defineDefaults({
        ui: {
            container: "flex grow flex-col gap-1",
            group: {
                wrapper: {
                    container: `
                        relative z-0 flex w-full flex-row items-center rounded-(--rf-radius-xl)
                        bg-(--rf-color-background-100) outline-2 outline-transparent transition-all duration-300
                        has-[:focus]:text-(--rf-color-primary) has-[:focus]:outline-(--rf-color-primary)
                    `,
                    leading: "p-3 pr-0 flex",
                    trailing: "p-3 pl-0 flex"
                },
                field: {
                    container: "grow",
                    textarea: "w-full rounded-(--rf-radius-lg) bg-transparent outline-none p-3"
                }
            }
        },
        default: "",
        rows: 3
    });

    export type Props = Element<typeof defaults, "textarea">
        & Utils["Description"]
        & Utils["Error"]
        & Utils["Loading"]
        & Utils["Length"]
        & Utils["Placeholder"]
        & {
            mask?: Mask
            rows?: number
        };
</script>

<script setup lang="ts">
    const _props = withDefaults(defineProps<Props>(), {
        required: undefined,
        loading: undefined
    });

    const {
        mask,
        model,
        props
    } = await useInjection(_props);
</script>
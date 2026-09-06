<template>
    <div :class="props.ui?.container">
        <RUtilsLabel v-if="props.label" />

        <div :class="props.ui?.group?.wrapper?.container">
            <div
                v-if="$slots.leading"
                :class="props.ui?.group?.wrapper?.leading"
            >
                <slot name="leading" />
            </div>

            <button
                type="button"
                :class="props.ui?.group?.controls"
                @click="decrease"
            >
                <Icon name="minus" />
            </button>

            <div :class="props.ui?.group?.field?.container">
                <RUtilsPlaceholder v-if="props.placeholder" />
                <input
                    v-model="model"
                    :name="String(props.name)"
                    type="number"
                    inputmode="numeric"
                    :class="props.ui?.group?.field?.input"
                />
            </div>

            <button
                type="button"
                :class="props.ui?.group?.controls"
                @click="increase"
            >
                <Icon name="plus" />
            </button>

            <div
                v-if="$slots.trailing"
                :class="props.ui?.group?.wrapper?.trailing"
            >
                <slot name="trailing" />
            </div>

            <RUtilsLoading v-if="props.loading !== undefined" />
        </div>

        <RUtilsDescription v-if="props.description" />
        <RUtilsError v-if="props.error" />
    </div>
</template>

<script lang="ts">
    import { useInjection } from "#rform/composables";
    import type { Element } from "#rform/types";
    import type Utils from "#rform/types/components/utils/props";
    import { defineDefaults } from "#rform/utils";

    export const defaults = defineDefaults({
        ui: {
            container: "flex grow flex-col gap-1",
            group: {
                wrapper: {
                    container: `
                        relative z-0 flex w-full flex-row items-center rounded-(--rf-radius-xl)
                        bg-(--rf-color-background-100) outline-2 outline-transparent transition-all duration-300
                        has-focus:text-(--rf-color-primary) has-focus:outline-(--rf-color-primary)
                    `,
                    leading: "flex p-3 pr-0",
                    trailing: "flex p-3 pl-0"
                },
                field: {
                    container: "flex grow flex-col",
                    input: `
                        w-full [appearance:textfield] rounded-(--rf-radius-lg) bg-transparent p-3 text-center outline-none
                        [&::-webkit-inner-spin-button]:appearance-none
                        [&::-webkit-outer-spin-button]:appearance-none
                    `
                },
                controls: `
                    flex cursor-pointer p-3 transition-colors
                    hover:text-(--rf-color-primary)
                `
            },
            Utils: {
                Placeholder: {
                    notFilled: "left-1/2 -translate-x-1/2"
                }
            }
        },
        default: 0,
        step: 1
    });

    export type Props = Element<typeof defaults, "number", null | number> &
        Utils["Description"] &
        Utils["Error"] &
        Utils["Loading"] &
        Utils["Placeholder"] & {
            step?: number;
            min?: number;
            max?: number;
        };
</script>

<script setup lang="ts">
    const _props = withDefaults(defineProps<Props>(), {
        required: undefined,
        loading: undefined
    });

    const { model, props } = await useInjection(_props, {
        set(value) {
            if (typeof value === "string") {
                return Number.parseInt(value) || null;
            }

            return value;
        }
    });

    const increase = () => {
        const value = model.value || 0;
        if (props.value.max === undefined || value < props.value.max) {
            model.value = value + (props.value.step ?? 1);
        }
    };

    const decrease = () => {
        const value = model.value || 0;
        if (props.value.min === undefined || value > props.value.min) {
            model.value = value - (props.value.step ?? 1);
        }
    };
</script>
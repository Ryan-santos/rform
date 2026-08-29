<template>
    <div :class="props.ui?.container">
        <RUtilsLabel />

        <TransitionGroup
            v-bind="props.ui?.list?.transitionGroup"
            appear
            tag="ul"
            :class="props.ui?.list?.container"
        >
            <li
                v-for="(item, index) in model"
                :key="index"
                :class="props.ui?.list?.item?.container"
            >
                <slot
                    :item
                    :index
                />
                <Icon
                    v-if="canRemove"
                    name="remove"
                    size="1.2rem"
                    :class="props.ui?.list?.item?.remove"
                    @click="model?.splice(index, 1)"
                />
            </li>
            <li
                v-if="canAdd"
                key="remover"
            >
                <button
                    type="button"
                    :class="props.ui?.list?.add"
                    @click="model?.push(undefined)"
                >
                    <Icon name="plus" />
                    {{ props.buttonText ?? "Adicionar" }}
                </button>
            </li>
        </TransitionGroup>
    </div>
</template>

<script lang="ts">
    import { computed } from "vue";

    import { useInjection, useProvide } from "#rform/composables";
    import type { Element } from "#rform/types";
    import type Utils from "#rform/types/components/utils/props";
    import { defineDefaults } from "#rform/utils";

    export const defaults = defineDefaults({
        ui: {
            container: "flex flex-col gap-1",
            list: {
                transitionGroup: {
                    name: "",
                    enterActiveClass: "transition-opacity duration-500",
                    moveClass: "transition-all duration-500",
                    enterFromClass: "opacity-0",
                    enterToClass: "opacity-100",
                    leaveActiveClass: "absolute transition-opacity duration-500",
                    leaveFromClass: "opacity-100",
                    leaveToClass: "opacity-0"
                },
                container: `
                    relative flex flex-col gap-6 rounded-xl border border-current/10
                    p-4
                `,
                item: {
                    container: "flex flex-row items-center gap-2",
                    remove: `
                        cursor-pointer text-contrast/20 transition-all duration-300
                        hover:text-danger
                    `
                },
                add: `
                    w-full rounded-xl border-2 border-dashed border-contrast/20 px-2 py-1
                    text-contrast/20 transition-all duration-300
                    hover:border-primary hover:text-primary
                `
            }
        },
        default: []
    });

    export type Props = Element<typeof defaults> &
        Utils["Label"] & {
            min?: number;
            max?: number;
            buttonText?: string;
        };
</script>

<script setup lang="ts">
    const _props = withDefaults(defineProps<Props>(), {
        required: undefined,
        loading: undefined
    });

    const { id, model, props } = await useInjection(_props);

    useProvide({ id, model });

    const length = computed(() => model.value?.length ?? 0);

    const canRemove = computed(() => {
        return props.value?.min ? length.value > props.value.min : true;
    });

    const canAdd = computed(() => {
        return props.value?.max ? length.value < props.value.max : true;
    });
</script>
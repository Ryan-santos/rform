<template>
    <div :class="props.ui?.container">
        <RUtilsLabel v-if="props.label" />

        <TransitionGroup
            v-bind="props.ui?.list?.transitionGroup"
            appear
            tag="ul"
            :class="props.ui?.list?.container"
        >
            <li
                v-for="index in length"
                :key="index - 1"
                :class="props.ui?.list?.item?.container"
            >
                <Row :index="index - 1" />
                <Icon
                    v-if="canRemove"
                    name="remove"
                    size="1.2rem"
                    :class="props.ui?.list?.item?.remove"
                    @click="model?.splice(index - 1, 1)"
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
    import { computed, defineComponent, useSlots } from "vue";

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
                    relative flex flex-col gap-6 rounded-(--rf-radius-xl) border border-current/10
                    p-4
                `,
                item: {
                    container: "flex flex-row items-center gap-2",
                    remove: `
                        cursor-pointer text-(--rf-color-contrast)/20 transition-all duration-300
                        hover:text-(--rf-color-danger)
                    `
                },
                add: `
                    w-full rounded-(--rf-radius-xl) border-2 border-dashed border-(--rf-color-contrast)/20 px-2 py-1
                    text-(--rf-color-contrast)/20 transition-all duration-300
                    hover:border-(--rf-color-primary) hover:text-(--rf-color-primary)
                `
            }
        },
        default: []
    });

    export type Props = Element<typeof defaults, "array"> &
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

    /**
     * One render effect per row, so `item` is read inside the row that owns it.
     *
     * `v-for="(item, index) in model"` read every element in *this* component's
     * render, which made one keystroke — a write to `array[i]` — invalidate the
     * whole list and repatch every sibling: 0,6 ms at 10 rows and 4,1 ms at 100,
     * growing with the list where a flat form stayed flat. Iterating `length`
     * and passing `item` through a getter is not enough on its own, because
     * `v-bind` on a `<slot>` normalises the object and reads the getter anyway.
     * A component boundary is what actually scopes the dependency.
     */
    const slots = useSlots();

    const Row = defineComponent({
        name: "RArrayRow",
        props: {
            index: {
                type: Number,
                required: true
            }
        },
        setup: (rowProps) => () => slots.default?.({
            index: rowProps.index,
            item: (model.value as unknown[] | undefined)?.[rowProps.index]
        })
    });

    const canRemove = computed(() => {
        return props.value?.min ? length.value > props.value.min : true;
    });

    const canAdd = computed(() => {
        return props.value?.max ? length.value < props.value.max : true;
    });
</script>
<template>
    <div :class="props.ui?.container">
        <RUtilsLabel />

        <div :class="props.ui?.stars">
            <button
                v-for="star in props.max"
                :key="star"
                type="button"
                :data-testid="`rating-${star}`"
                :class="star <= Number(model ?? 0) ? props.ui?.on : props.ui?.off"
                @click="model = star"
            >
                *
            </button>
        </div>

        <RUtilsHint />
        <RUtilsError />
    </div>
</template>

<script lang="ts">
    /**
     * Campo novo do usuário — cobre o caminho de um `.vue` em `app/rform/fields` que
     * não substitui nada.
     *
     * @example <RRating name="nota" :max="10" />
     */
    import { useField } from "#rform/composables";
    import type { Element } from "#rform/types";
    import type Utils from "#rform/types/components/utils/props";
    import { defineDefaults } from "#rform/utils";

    export const defaults = defineDefaults({
        ui: {
            container: "rating",
            stars: "rating-stars",
            on: "rating-on",
            off: "rating-off"
        },
        default: 0,
        max: 5
    });

    export type Props = Element<typeof defaults, "rating"> &
        Utils["Label"] &
        Utils["Error"] &
        Utils["Hint"] & {
            max?: number;
        };
</script>

<script setup lang="ts">
    const _props = withDefaults(defineProps<Props>(), {
        required: undefined,
        loading: undefined
    });

    const { model, props } = await useField(_props);
</script>
<template>
    <label
        v-if="props.label"
        :class="props.ui.container"
    >
        {{ props.label }}
        <span
            v-if="props.required"
            :class="props.ui.required"
        >
            *
        </span>
    </label>
</template>

<script lang="ts">
    import { useUtilProps } from "#rform/composables";
    import type { DeepPartial } from "#rform/types";
    import { defineDefaults } from "#rform/utils";

    export const defaults = defineDefaults({
        label: "",
        ui: {
            container: "",
            required: "font-bold text-(--rf-color-danger)"
        }
    });

    export type Props = {
        label?: string
        ui?: DeepPartial<typeof defaults.ui>
    };
</script>

<script setup lang="ts">
    const {
        props
    } = await useUtilProps<Props>();
</script>
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

    export const defaultUi = {
        container: "",
        required: "font-bold text-danger"
    };

    export type Props = {
        label?: string
        ui?: DeepPartial<typeof defaultUi>
    };

    export const defaults: Props = {
        label: "",
        ui: defaultUi
    };
</script>

<script setup lang="ts">
    const {
        props
    } = await useUtilProps<Props>();
</script>
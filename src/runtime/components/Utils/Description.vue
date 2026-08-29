<template>
    <p
        v-if="props.description"
        :class="props.ui"
    >
        {{ props.description }}
    </p>
</template>

<script lang="ts">
    import { useUtilProps } from "#rform/composables";

    export type Props = {
        description?: string
        ui?: string
    };

    export const defaults: Props = {
        description: "",
        ui: "text-xs text-current/50"
    };
</script>

<script setup lang="ts">
    const {
        props
    } = await useUtilProps<Props>();
</script>
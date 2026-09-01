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
    import { defineDefaults } from "#rform/utils";

    export const defaults = defineDefaults({
        description: "",
        ui: "text-xs text-current/50"
    });

    export type Props = {
        description?: string
        ui?: typeof defaults.ui
    };
</script>

<script setup lang="ts">
    const {
        props
    } = await useUtilProps<Props>();
</script>
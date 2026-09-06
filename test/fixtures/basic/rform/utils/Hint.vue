<template>
    <span
        v-if="props.hint"
        data-testid="hint"
        :class="props.ui.container"
    >
        {{ props.hint }}
    </span>
</template>

<script lang="ts">
    import { useUtil } from "#rform/composables";
    import type { DeepPartial } from "#rform/types";
    import { defineDefaults } from "#rform/utils";

    export const defaults = defineDefaults({
        hint: "",
        ui: {
            container: "hint"
        }
    });

    export type Props = {
        hint?: string;
        ui?: DeepPartial<typeof defaults.ui>;
    };
</script>

<script setup lang="ts">
    const { props } = await useUtil<Props>();
</script>
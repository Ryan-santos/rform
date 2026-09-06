<template>
    <p
        v-if="props.description"
        :class="props.ui"
    >
        {{ tr(props.description) }}
    </p>
</template>

<script lang="ts">
    import { useUtilProps } from "#rform/composables";
    import type { TrInput } from "#rform/types";
    import { defineDefaults } from "#rform/utils";

    /** No `description: ""` sentinel — see the note in `utils/Label.vue`. */
    export const defaults = defineDefaults({
        ui: "text-xs text-current/50"
    });

    export type Props = {
        description?: TrInput;
        ui?: typeof defaults.ui;
    };
</script>

<script setup lang="ts">
    const { props, tr } = useUtilProps<Props>(defaults);
</script>
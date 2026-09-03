<template>
    <span
        v-if="props.hint"
        :class="props.ui.container"
    >
        <Icon
            :name="props.ui.icon.name"
            :class="props.ui.icon.class"
        />
        {{ props.hint }}
    </span>
</template>

<script lang="ts">
    import { useUtilProps } from "#rform/composables";
    import type { DeepPartial } from "#rform/types";
    import { defineDefaults } from "#rform/utils";

    export const defaults = defineDefaults({
        hint: "",
        ui: {
            container: "ml-1 flex flex-row items-center gap-1 text-xs text-current/50",
            icon: {
                name: "alert",
                class: "shrink-0"
            }
        }
    });

    export type Props = {
        hint?: string
        ui?: DeepPartial<typeof defaults.ui>
    };
</script>

<script setup lang="ts">
    const {
        props
    } = useUtilProps<Props>(defaults);
</script>

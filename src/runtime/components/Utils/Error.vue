<template>
    <p
        v-if="props.error"
        :class="props.ui?.container"
    >
        <Icon
            v-if="props.ui?.icon?.name"
            :name="props.ui?.icon?.name"
            :class="props.ui?.icon?.class"
        />
        {{ props.error }}
    </p>
</template>

<script lang="ts">
    import { useUtilProps } from "#rform/composables";
    import type { DeepPartial } from "#rform/types";
    import { classes } from "#rform/utils";

    export const defaultUi = {
        container: classes("text-danger ml-1 text-sm font-semibold tracking-wide"),
        icon: {
            name: "alert",
            class: "mr-0.5 -mb-0.5 animate-pulse"
        }
    };

    export type Props = {
        error?: string
        ui?: DeepPartial<typeof defaultUi>
    };

    export const defaults: Props = {
        error: "",
        ui: defaultUi
    };
</script>

<script setup lang="ts">
    const {
        props
    } = await useUtilProps<Props>();
</script>
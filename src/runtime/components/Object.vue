<template>
    <div :class="props.ui?.container">
        <RUtilsLabel />

        <div :class="props.ui?.group">
            <slot />
        </div>
    </div>
</template>

<script lang="ts">
    import type { Element } from "#rform/types";
    import { defineDefaults } from "#rform/utils";
    import { useInjection, useProvide } from "#rform/composables";
    import type Utils from "#rform/types/components/utils/props";

    export const defaults = defineDefaults({
        ui: {
            container: "flex flex-col gap-1",
            group: "flex flex-col gap-6 rounded-xl border border-current/10 p-4"
        },
        default: {}
    });

    export type Props = Element<typeof defaults, "object">
        & Utils["Label"];
</script>

<script setup lang="ts">
    const _props = withDefaults(defineProps<Props>(), {
        required: undefined,
        loading: undefined
    });

    const {
        id,
        model,
        props
    } = await useInjection(_props);

    useProvide({
        id,
        model
    });
</script>
<template>
    <div
        :class="props.ui?.container"
        data-testid="custom-switch"
    >
        <RUtilsLabel />
        <button
            type="button"
            data-testid="custom-switch-toggle"
            @click="model = !model"
        >
            {{ model ? "on" : "off" }}
        </button>
    </div>
</template>

<script lang="ts">
    // Replaces the built-in Switch, reusing its defaults through the escape
    // hatch rather than restating them.
    import { defaults as builtin } from "#rform/builtin/fields/Switch.vue";
    import { useInjection } from "#rform/composables";
    import type { Element } from "#rform/types";
    import type Utils from "#rform/types/components/utils/props";
    import { defineDefaults } from "#rform/utils";

    export const defaults = defineDefaults({
        ...builtin,
        ui: {
            ...builtin.ui,
            container: "custom-switch"
        },
        default: true
    });

    export type Props = Element<typeof defaults, "switch"> & Utils["Label"];
</script>

<script setup lang="ts">
    const _props = withDefaults(defineProps<Props>(), {
        required: undefined,
        loading: undefined
    });

    const { model, props } = await useInjection(_props);
</script>
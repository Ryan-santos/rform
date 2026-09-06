<template>
    <label
        v-if="props.label"
        :class="props.ui.container"
    >
        {{ tr(props.label) }}
        <span
            v-if="props.required"
            :class="props.ui.required"
        >
            *
        </span>
    </label>
</template>

<script lang="ts">
    import { useUtil } from "#rform/composables";
    import type { DeepPartial, TrInput } from "#rform/types";
    import { defineDefaults } from "#rform/utils";

    /**
     * No `label: ""` sentinel any more: `label` is a `TrInput` now, and under
     * an app with `@nuxtjs/i18n` that type is `ModuleKey | Literal` — `""` is
     * neither, so the default was the one thing in the module's own source that
     * failed the app's own type-check. It bought nothing: `v-if="props.label"`
     * reads `undefined` exactly the way it read `""`, and `merger` never let a
     * falsy default block anything either.
     */
    export const defaults = defineDefaults({
        ui: {
            container: "",
            required: "font-bold text-(--rf-color-danger)"
        }
    });

    export type Props = {
        label?: TrInput;
        ui?: DeepPartial<typeof defaults.ui>;
    };
</script>

<script setup lang="ts">
    const { props, tr } = useUtil<Props>(defaults);
</script>
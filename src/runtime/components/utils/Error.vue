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
    /**
     * Mensagem de erro do campo, alimentada pelo `error` que a validação escreve.
     */
    import { useUtil } from "#rform/composables";
    import type { DeepPartial } from "#rform/types";
    import { defineDefaults } from "#rform/utils";

    export const defaults = defineDefaults({
        error: "",
        ui: {
            container: "text-(--rf-color-danger) ml-1 text-sm font-semibold tracking-wide",
            icon: {
                name: "alert",
                class: "mr-0.5 -mb-0.5 animate-pulse"
            }
        }
    });

    export type Props = {
        error?: string;
        ui?: DeepPartial<typeof defaults.ui>;
    };
</script>

<script setup lang="ts">
    const { props } = useUtil<Props>(defaults);
</script>
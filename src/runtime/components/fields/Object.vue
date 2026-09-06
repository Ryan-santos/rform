<template>
    <div :class="props.ui?.container">
        <RUtilsLabel v-if="props.label" />

        <div :class="props.ui?.group">
            <slot />
        </div>

        <RUtilsError v-if="props.error" />
    </div>
</template>

<script lang="ts">
    /**
     * Container aninhado: agrupa os filhos sob a própria chave no model do Form.
     *
     * @example <RObject name="endereco"><RText name="rua" /></RObject>
     */
    import { useField, useProvide } from "#rform/composables";
    import type { Element } from "#rform/types";
    import type Utils from "#rform/types/components/utils/props";
    import { defineDefaults } from "#rform/utils";

    export const defaults = defineDefaults({
        ui: {
            container: "flex flex-col gap-1",
            group: "flex flex-col gap-6 rounded-(--rf-radius-xl) border border-current/10 p-4"
        },
        default: {}
    });

    export type Props = Element<typeof defaults, "object"> & Utils["Label"] & Utils["Error"];
</script>

<script setup lang="ts">
    const _props = withDefaults(defineProps<Props>(), {
        required: undefined,
        loading: undefined
    });

    const { id, model, props } = await useField(_props);

    useProvide({
        id,
        model
    });
</script>
<template>
    <span
        :class="[
            props.ui?.default,
            floating ? props.ui?.filled : props.ui?.notFilled,
            floatingDisable ? props.ui?.disable : ''
        ]"
    >
        {{ props.placeholder }}
        <span
            v-if="props.required && !props.label"
            :class="props.ui?.required"
        >
            *
        </span>
    </span>
</template>

<script lang="ts">
    import { computed } from "vue";

    import { useUtilProps } from "#rform/composables";
    import type { DeepPartial } from "#rform/types";
    import { classes } from "#rform/utils";

    export const defaultUi = classes({
        default: `
            text-contrast/30 bg-background-100 pointer-events-none block w-fit rounded-sm
            transition-[translate_position] duration-300
        `,
        filled: "absolute inset-x-0 top-0 left-2 -translate-y-1/2 px-1 py-0.5 text-xs",
        notFilled: "relative top-3 left-3 -z-10 h-0",
        disable: "font-bold opacity-0",
        required: "text-danger font-bold"
    });

    export type Props = {
        placeholder?: string;
        label?: string;
        ui?: DeepPartial<typeof defaultUi>;
    };

    export const defaults: Props = {
        ui: defaultUi
    };
</script>

<script setup lang="ts">
    const componentProps = defineProps<{
        focused?: boolean;
    }>();

    const { props, upper } = await useUtilProps<Props>();

    const modelFilled = computed(() => {
        return !!String(upper.model.value ?? "").length;
    });

    const floating = computed(() => {
        if (props.value.label) {
            return false;
        }

        if (!props.value.placeholder) {
            return false;
        }

        return modelFilled.value || !!componentProps.focused;
    });

    const floatingDisable = computed(() => {
        return modelFilled.value && !floating.value;
    });
</script>
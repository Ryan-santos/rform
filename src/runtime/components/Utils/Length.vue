<template>
    <span
        v-if="props.length"
        :class="[
            props.ui.container,
            _class
        ]"
    >
        {{ valueLength }} / {{ props.length }}
    </span>
</template>

<script lang="ts">
    import { useUtilProps } from "#rform/composables";
    import type { DeepPartial } from "#rform/types";
    import { computed, watch } from "vue";

    export const defaultUi = {
        container: "absolute right-2 top-0 w-fit -translate-y-1/2 rounded-sm bg-background-100 text-xs leading-none px-1 py-0.5 font-bold text-contrast transition-all duration-300",
        percentages: {
            60: "text-warn",
            80: "text-danger",
            100: "bg-danger text-white"
        } as Record<number, string>
    };

    export type Props = {
        length?: number | string
        ui?: DeepPartial<typeof defaultUi>
    };

    export const defaults: Props = {
        ui: defaultUi
    };
</script>

<script setup lang="ts">
    const {
        props,
        upper
    } = await useUtilProps<Props>();

    const max = computed(() => {
        return typeof props.value.length === "string"
            ? Number.parseInt(props.value.length)
            : props.value.length;
    });

    watch(() => upper.model.value, (value) => {
        if (max.value === undefined) {
            return;
        }

        const inString = String(value);

        if (inString.length >= (max.value + 1)) {
            const cut = inString.substring(0, max.value);

            if (typeof value === "number") {
                value = Number.parseInt(cut);
                return Number.parseInt(cut);
            }

            upper.model.value = cut;
        }
    });

    const valueLength = computed(() => {
        return String(upper.model.value ?? "").length;
    });

    const _class = computed(() => {
        if (max.value === undefined) {
            return "";
        }

        const currentPercentage = Math.round((valueLength.value / max.value) * 100);

        const percentagesArray = Object
            .keys(props.value.ui.percentages)
            .map(v => Number(v))
            .sort((a, b) => b - a);

        for (const percentage of percentagesArray) {
            if (currentPercentage >= percentage && props.value.ui.percentages[percentage]) {
                return props.value.ui.percentages[percentage];
            }
        }

        return "";
    });
</script>
<template>
    <Transition
        v-bind="props.ui.transition"
    >
        <Icon
            v-if="props.loading"
            name="loading"
            size="1.2rem"
            :class="props.ui.icon"
        />
    </Transition>
</template>

<script lang="ts">
    import { useUtilProps } from "#rform/composables";
    import type { DeepPartial } from "#rform/types";
    import { defineDefaults } from "#rform/utils";

    const ui = {
        transition: {
            name: "",
            enterActiveClass: "transition-all duration-500",
            enterToClass: "",
            enterFromClass: "opacity-0",
            leaveActiveClass: "transition-all duration-500",
            leaveToClass: "opacity-0",
            leaveFromClass: ""
        },
        icon: "text-primary m-3 ml-0"
    };

    export const defaults = defineDefaults({ ui });

    export type Props = {
        loading?: boolean
        ui?: DeepPartial<typeof defaults.ui>
    };
</script>

<script setup lang="ts">
    const {
        props
    } = await useUtilProps<Props>();
</script>
<template>
    <div class="flex flex-col gap-3">
        <div class="flex w-fit flex-row flex-wrap gap-1 rounded-xl border border-primary/10 bg-background-100 p-1">
            <button
                v-for="mode in modes"
                :key="mode.id"
                type="button"
                class="cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-all duration-300"
                :class="current === mode.id
                    ? 'bg-gradient-to-r from-primary to-secondary font-medium text-white shadow-sm shadow-primary/30'
                    : 'text-contrast/60 hover:bg-primary/5 hover:text-primary'"
                @click="current = mode.id"
            >
                {{ mode.label }}
            </button>
        </div>

        <p
            v-if="active?.description"
            class="max-w-prose text-sm text-contrast/60"
        >
            {{ active.description }}
        </p>
    </div>
</template>

<script setup lang="ts">
    import { computed } from "vue";

    const props = defineProps<{
        modes: { id: string, label: string, description?: string }[]
    }>();

    const current = defineModel<string>({ required: true });

    const active = computed(() => props.modes.find(mode => mode.id === current.value));
</script>

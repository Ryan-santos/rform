<template>
    <section class="flex flex-col gap-4 rounded-2xl border border-contrast/10 bg-background-50 p-5">
        <header class="flex flex-col gap-1">
            <h2 class="text-lg leading-tight font-semibold">{{ title }}</h2>
            <p
                v-if="description"
                class="max-w-prose text-sm text-contrast/60"
            >
                {{ description }}
            </p>
        </header>

        <slot />
    </section>
</template>

<script setup lang="ts">
    /**
     * Um cenário do playground: título, uma linha de contexto e o conteúdo.
     */
    withDefaults(
        defineProps<{
            title: string;
            description?: string;
        }>(),
        {
            description: undefined
        }
    );
</script>
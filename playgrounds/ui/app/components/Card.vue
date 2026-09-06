<template>
    <section class="flex flex-col gap-4 rounded-2xl border border-contrast/10 bg-background-50 p-5">
        <h2
            v-if="title"
            class="font-mono text-xs tracking-widest text-contrast/40 uppercase"
        >
            {{ title }}
        </h2>

        <slot />
    </section>
</template>

<script setup lang="ts">
    /**
     * A caixa de um cenário: um título curto, opcional, e o conteúdo.
     */
    withDefaults(defineProps<{ title?: string }>(), { title: undefined });
</script>
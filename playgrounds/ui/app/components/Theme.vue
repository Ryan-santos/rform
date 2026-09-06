<template>
    <div
        data-allow-mismatch
        class="flex w-fit flex-row items-center gap-0.5 rounded-xl bg-background-100 p-1"
    >
        <button
            v-for="option in ['light', 'dark', 'system']"
            :key="option"
            type="button"
            class="cursor-pointer rounded-lg px-2 py-1 font-mono text-xs transition-colors"
            :class="
                colorMode.preference === option
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-contrast/40 hover:text-contrast'
            "
            @click="colorMode.preference = option"
        >
            {{ option }}
        </button>
    </div>
</template>

<script setup lang="ts">
    /**
     * Seletor de tema do playground: claro, escuro ou o do sistema.
     */
    const colorMode = useColorMode();
</script>
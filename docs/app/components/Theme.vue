<template>
    <div
        data-allow-mismatch
        role="radiogroup"
        aria-label="Tema"
        class="flex w-fit flex-row items-center gap-0.5 rounded-xl bg-background-100 p-1"
    >
        <button
            v-for="option in options"
            :key="option.id"
            type="button"
            role="radio"
            :aria-checked="colorMode.preference === option.id"
            :aria-label="option.label"
            :title="option.title"
            class="flex size-7 cursor-pointer items-center justify-center rounded-lg transition-all duration-300"
            :class="
                colorMode.preference === option.id
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-contrast/40 hover:text-contrast'
            "
            @click="colorMode.preference = option.id"
        >
            <svg
                viewBox="0 0 24 24"
                class="size-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path :d="option.path" />
            </svg>
        </button>
    </div>
</template>

<script setup lang="ts">
    /**
     * Seletor de tema do site: claro, escuro ou o do sistema.
     */
    const colorMode = useColorMode();

    // `system` é opção de verdade, não estado escondido: um toggle de duas posições,
    // uma vez tocado, nunca mais devolvia a escolha ao sistema operacional.
    const options = [
        {
            id: "light",
            label: "Claro",
            title: "tema claro",
            path: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4"
        },
        {
            id: "dark",
            label: "Escuro",
            title: "tema escuro",
            path: "M20.5 14.8A8.5 8.5 0 0 1 9.2 3.5a8.5 8.5 0 1 0 11.3 11.3Z"
        },
        {
            id: "system",
            label: "Sistema",
            title: "seguir o sistema",
            path: "M4 5h16v10H4zM9 20h6M12 15v5"
        }
    ];
</script>
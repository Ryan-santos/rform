<template>
    <div class="flex w-fit flex-row items-center gap-0.5 rounded-xl bg-background-100 p-1">
        <button
            v-for="option in codes"
            :key="option"
            type="button"
            class="cursor-pointer rounded-lg px-2 py-1 font-mono text-xs transition-colors"
            :class="
                locale === option
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-contrast/40 hover:text-contrast'
            "
            @click="locale = option"
        >
            {{ option }}
        </button>
    </div>
</template>

<script setup lang="ts">
    /**
     * Sem ponte, o locale ativo é um `useState("rform-locale")` — escrever nele é
     * como se troca de idioma. Não há `useI18n` neste app.
     */
    const codes = ["pt-BR", "en", "es"];

    const locale = useState<string>("rform-locale");
</script>
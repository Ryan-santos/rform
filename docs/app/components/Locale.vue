<template>
    <div class="flex w-fit flex-row items-center gap-0.5 rounded-xl bg-background-100 p-1">
        <NuxtLink
            v-for="option in locales"
            :key="option.code"
            :to="switchLocalePath(option.code)"
            class="cursor-pointer rounded-lg px-2 py-1 font-mono text-xs transition-colors"
            :class="
                option.code === locale
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-contrast/40 hover:text-contrast'
            "
        >
            {{ option.code }}
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
    /**
     * Seletor de idioma do site. Troca o prefixo da rota — os slugs são idênticos
     * nos dois idiomas, então a página é a mesma e só a prosa muda.
     */
    const { locale, locales } = useI18n();

    const switchLocalePath = useSwitchLocalePath();
</script>
<template>
    <Menu
        icon="fa6-solid:globe"
        :label="$t('nav.language')"
    >
        <template #default="{ close }">
            <NuxtLink
                v-for="option in locales"
                :key="option.code"
                :to="switchLocalePath(option.code)"
                class="flex cursor-pointer flex-row items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-background-100"
                :class="option.code === locale ? 'text-primary' : 'text-contrast/70'"
                @click="close"
            >
                {{ option.name }}

                <code class="font-mono text-xs text-contrast/30">{{ option.code }}</code>

                <Icon
                    v-if="option.code === locale"
                    name="mi:check"
                    class="ml-auto size-3.5 flex-none"
                />
            </NuxtLink>
        </template>
    </Menu>
</template>

<script setup lang="ts">
    /**
     * Seletor de idioma do site. Troca o prefixo da rota — os slugs são idênticos
     * nos dois idiomas, então a página é a mesma e só a prosa muda.
     */
    const { locale, locales } = useI18n();

    const switchLocalePath = useSwitchLocalePath();
</script>
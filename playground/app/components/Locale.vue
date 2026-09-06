<template>
    <RSelect
        :modelValue="locale"
        :options="options"
        :ui="{
            container: 'w-24',
            group: {
                field: {
                    selected: 'p-2 min-h-0',
                    text: 'text-xs'
                },
                icon: 'm-2'
            },
            Utils: {
                Dropdown: {
                    popover: 'w-30'
                }
            }
        }"
        aria-label="Idioma"
        @update:modelValue="change"
    />
</template>

<script setup lang="ts">
    const { locale, locales, setLocale } = useI18n();

    const options = computed(() =>
        Object.fromEntries(locales.value.map((option) => [option.code, option.name ?? option.code]))
    );

    const change = (value: unknown) => setLocale(value as typeof locale.value);
</script>
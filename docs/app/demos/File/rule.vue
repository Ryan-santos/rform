<template>
    <RFile
        name="ruleTamanho"
        label="demo.file.maximoUmMega"
        accept="png, jpg, pdf"
        :rule="ateUmMega"
    />
</template>

<script setup lang="ts">
    const { t } = useI18n();

    // Declarado aqui, e não inline no template: `File` é um global do browser, e o
    // template só enxerga o escopo do componente.
    const ateUmMega = ({ value }: { value: unknown }) =>
        value instanceof File && value.size > 1024 * 1024
            ? t("demo.file.acimaDeUmMega")
            : undefined;
</script>
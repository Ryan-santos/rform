<template>
    <RText
        name="ruleFn"
        label="demo.text.soAceitaUm"
        :rule="({ value }) => (value === '1' ? undefined : $t('demo.text.digiteUm'))"
    />
    <RText
        name="ruleForm"
        label="demo.text.diferenteDoAnterior"
        :rule="
            ({ value, form }) =>
                value && value === form?.ruleFn ? $t('demo.text.naoRepita') : undefined
        "
    />
    <RText
        name="ruleZod"
        label="~~z.string().min(5)"
        :rule="z.string().min(5, $t('demo.text.minimoCinco'))"
    />
</template>

<script setup lang="ts">
    import { z } from "zod";
</script>
<template>
    <RDynamic :schema />
</template>

<script setup lang="ts">
    import type { Schema } from "#rform/types/schema";

    // `rating` é um `type` válido porque o arquivo em `app/rform/fields` entrou
    // no `FieldType` — o mesmo union dos campos embutidos.
    const schema: Schema = {
        apelido: { type: "text", label: "demo.customizados.apelido" },
        nota: { type: "rating", label: "demo.customizados.nota", max: 5, rule: "required" }
    };
</script>
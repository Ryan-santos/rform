<template>
    <pre
        class="max-h-96 overflow-auto rounded-xl border border-code-line bg-code p-3 font-mono text-xs leading-relaxed text-code-text/80"
        >{{ text }}</pre>
</template>

<script setup lang="ts">
    /**
     * O painel de model: imprime o valor vivo do formulário como JSON.
     */
    import { computed } from "vue";

    const props = defineProps<{
        value: unknown;
    }>();

    // Um `File` serializa como `{}`, que se lê como "o campo está vazio" — a única
    // mentira que este painel existe para evitar.
    const replacer = (_key: string, value: unknown) =>
        typeof File !== "undefined" && value instanceof File
            ? `File(${value.name}, ${value.size} bytes)`
            : value;

    const text = computed(() => {
        try {
            return JSON.stringify(props.value, replacer, 4) ?? "undefined";
        } catch (error) {
            return `// não serializável: ${String(error)}`;
        }
    });
</script>
<template>
    <DemoCode
        :code="json"
        lang="json"
        :label="title"
        :hint="summary"
    />
</template>

<script setup lang="ts">
    import { computed } from "vue";

    const props = withDefaults(defineProps<{
        value?: unknown
        title?: string
    }>(), {
        value: undefined,
        title: "model"
    });

    /**
     * A `File` serializes to `{}`, which reads as "the field is empty" — the one
     * lie this panel exists to prevent.
     */
    const replacer = (_key: string, value: unknown) => {
        if (typeof File !== "undefined" && value instanceof File) {
            return `File(${value.name}, ${value.size} bytes, ${value.type || "sem tipo"})`;
        }

        return value;
    };

    const json = computed(() => {
        try {
            return JSON.stringify(props.value, replacer, 4) ?? "undefined";
        }
        catch (error) {
            return `// não serializável: ${String(error)}`;
        }
    });

    const summary = computed(() => {
        const value = props.value;

        if (Array.isArray(value)) {
            return `${value.length} ${value.length === 1 ? "item" : "itens"}`;
        }

        if (value && typeof value === "object") {
            const count = Object.keys(value).length;
            return `${count} ${count === 1 ? "chave" : "chaves"}`;
        }

        return typeof value;
    });
</script>

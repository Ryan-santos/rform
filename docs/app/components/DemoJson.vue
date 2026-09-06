<template>
    <DemoCode
        :code="json"
        lang="json"
        :label="title ?? $t('ui.model')"
        :hint="summary"
    />
</template>

<script setup lang="ts">
    /**
     * O painel de model: imprime o valor vivo do formulário como JSON.
     */
    import { computed } from "vue";

    const props = withDefaults(
        defineProps<{
            value?: unknown;
            title?: string;
        }>(),
        {
            value: undefined,
            title: undefined
        }
    );

    const { t } = useI18n();

    // Um `File` serializa como `{}`, que se lê como "o campo está vazio" — a única
    // mentira que este painel existe para evitar.
    const replacer = (_key: string, value: unknown) => {
        if (typeof File !== "undefined" && value instanceof File) {
            return `File(${value.name}, ${value.size} bytes, ${value.type || t("ui.noType")})`;
        }

        return value;
    };

    const json = computed(() => {
        try {
            return JSON.stringify(props.value, replacer, 4) ?? "undefined";
        } catch (error) {
            return `// ${t("ui.notSerializable")}: ${String(error)}`;
        }
    });

    const summary = computed(() => {
        const value = props.value;

        if (Array.isArray(value)) {
            return t("ui.items", { n: value.length }, value.length);
        }

        if (value && typeof value === "object") {
            const count = Object.keys(value).length;

            return t("ui.keys", { n: count }, count);
        }

        return typeof value;
    });
</script>
<template>
    <RForm
        v-model="data"
        :schema
        class="flex flex-col gap-4"
    >
        <DemoActions />
    </RForm>
</template>

<script setup lang="ts">
    import { useI18n } from "vue-i18n";

    const { t } = useI18n();

    // O rótulo de uma opção do RSelect é impresso cru, então quem traduz aqui é o
    // próprio demo.
    const modos = [
        { id: "casa", name: t("demo.condicional.casa") },
        { id: "retirada", name: t("demo.condicional.retirada") }
    ];

    // A condição olha o irmão `entrega`. Trocar para "retirada" some com os dois
    // campos de endereço — e o que já foi digitado continua no model ao lado.
    const { data, schema } = useRForm({
        entrega: {
            type: "select",
            label: "demo.condicional.entrega",
            default: "casa",
            options: modos
        },
        cep: {
            type: "text",
            label: "~~CEP",
            mask: "brCep",
            rule: ["required", "brCep"],
            visibleWhen: { field: "entrega", op: "===", value: "casa" }
        },
        complemento: {
            type: "text",
            label: "demo.condicional.complemento",
            // Duas condições num array: AND. O campo só entra depois do CEP.
            visibleWhen: [
                { field: "entrega", op: "===", value: "casa" },
                { field: "cep", op: "is_not_empty" }
            ]
        },
        presente: {
            type: "switch",
            placeholder: "demo.condicional.presente"
        },
        mensagem: {
            type: "textarea",
            label: "demo.condicional.mensagem",
            disabledWhen: { field: "presente", op: "!==", value: true }
        }
    });

    // O painel de model do `<Demo>` lê daqui: este exemplo monta o próprio `RForm`.
    defineExpose({ data });
</script>
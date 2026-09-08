<template>
    <div class="flex flex-col gap-6">
        <Scenario
            title="visibleWhen"
            :value="data"
        >
            <RForm
                ref="form"
                v-model="data"
                :schema
                :rules
                class="flex flex-col gap-4"
            />

            <div class="flex flex-row items-center gap-3">
                <button
                    type="button"
                    class="w-fit cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm text-white"
                    @click="enviar"
                >
                    ~~enviar
                </button>
                <span
                    v-if="resultado"
                    class="text-sm text-contrast/60"
                >
                    {{ resultado }}
                </span>
            </div>
        </Scenario>

        <Scenario
            title="disabledWhen"
            :value="entrega"
        >
            <RForm
                v-model="entrega"
                :schema="entregaSchema"
                class="flex flex-col gap-4"
            />
        </Scenario>

        <Card title="schema">
            <Json :value="schema" />
        </Card>
    </div>
</template>

<script setup lang="ts">
    import { ref, useTemplateRef } from "vue";

    import type { Schema } from "#rform/types/schema";

    // snake_case de propósito num dos dois: no schema o objeto vem de uma API.
    const { schema, data, rules } = useRForm({
        body_type: {
            type: "select",
            default: "json",
            options: ["json", "form", "none"]
        },
        body: {
            type: "textarea",
            label: "~~Corpo",
            rule: "required",
            visible_when: { field: "body_type", op: "in", value: ["json", "form"] }
        },
        charset: {
            type: "text",
            label: "~~Charset",
            visibleWhen: [
                { field: "body_type", op: "!==", value: "none" },
                { field: "body", op: "is_not_empty" }
            ]
        }
    } as unknown as Schema);

    const entregaSchema = {
        mesmo_endereco: {
            type: "switch",
            placeholder: "~~Entrega no mesmo endereço"
        },
        endereco: {
            type: "text",
            label: "~~Endereço de entrega",
            disabledWhen: { field: "mesmo_endereco", op: "===", value: true }
        }
    } as unknown as Schema;

    const entrega = ref<Record<string, unknown>>({});

    const form = useTemplateRef<{ submit: () => Promise<unknown> }>("form");

    const resultado = ref("");

    const enviar = async () => {
        const errors = await form.value?.submit();

        resultado.value = errors ? `reprovou: ${JSON.stringify(errors)}` : "passou";
    };
</script>
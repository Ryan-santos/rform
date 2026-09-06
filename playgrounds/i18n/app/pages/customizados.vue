<template>
    <div class="flex flex-col gap-6">
        <Scenario
            title="RRating e RUtilsHint, de app/rform"
            :value="data"
        >
            <RForm
                v-model="data"
                class="flex flex-col gap-4"
            >
                <RRating
                    name="nota"
                    label="~~Como foi o atendimento?"
                    rule="required"
                />
                <RRating
                    name="notaCurta"
                    label="~~Escala menor"
                    :max="3"
                    hint="max troca a quantidade de estrelas."
                />

                <button
                    type="submit"
                    class="w-fit cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm text-white"
                >
                    {{ $t("form.enviar") }}
                </button>
            </RForm>
        </Scenario>

        <Scenario
            title="no schema, pelo RDynamic"
            :value="dinamico"
        >
            <RForm
                v-model="dinamico"
                class="flex flex-col gap-4"
            >
                <RDynamic :schema />
            </RForm>
        </Scenario>
    </div>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    import type { Schema } from "#rform/types/schema";

    // O campo do usuário entra no `FieldType`, então `type: "rating"` é válido no
    // schema e o RDynamic o monta sozinho.
    const schema: Schema = {
        apelido: { type: "text", label: "~~Apelido" },
        nota: { type: "rating", label: "~~Nota", max: 5, rule: "required" }
    };

    const data = ref<Record<string, unknown>>({});

    const dinamico = ref<Record<string, unknown>>({});
</script>
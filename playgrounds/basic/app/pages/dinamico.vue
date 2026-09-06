<template>
    <div class="flex flex-col gap-6">
        <Scenario
            title="RDynamic com schema de /api/schema"
            :value="data"
        >
            <div class="flex w-fit flex-row gap-1 rounded-xl bg-background-100 p-1">
                <button
                    v-for="option in ['pj', 'pf']"
                    :key="option"
                    type="button"
                    class="cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-colors"
                    :class="
                        tipo === option
                            ? 'bg-primary text-white'
                            : 'text-contrast/60 hover:text-primary'
                    "
                    @click="tipo = option"
                >
                    {{ option }}
                </button>
            </div>

            <RForm
                v-model="data"
                class="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
                <RDynamic
                    v-if="schema"
                    :schema
                />
            </RForm>
        </Scenario>

        <Card title="schema">
            <Json :value="schema" />
        </Card>
    </div>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    import type { Schema } from "#rform/types/schema";

    const tipo = ref("pj");

    const data = ref<Record<string, unknown>>({});

    const { data: schema } = await useFetch<Schema>("/api/schema", {
        query: { tipo },
        // O model do formulário anterior não faz sentido no schema novo.
        onResponse: () => {
            data.value = {};
        }
    });
</script>
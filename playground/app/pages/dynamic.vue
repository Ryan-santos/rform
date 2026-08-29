<template>
    <section class="flex min-h-screen flex-col items-stretch gap-12 px-12 py-12">
        <div class="flex flex-col gap-3">
            <h2 class="text-2xl font-bold">Modo 1 — schema completo (renderiza UI)</h2>
            <RForm
                :schema="full.schema"
                v-model="full.data.value"
                :on-submit="handleSubmit1"
                class="grid auto-rows-min grid-cols-3 gap-4"
            >
                <template #users="{ fieldName, rule }">
                    <RArray
                        :name="fieldName"
                        label="Usuários (slot custom)"
                        :rule
                    >
                        <template v-slot="{ index }">
                            <RText
                                :name="index"
                                placeholder="nome do usuário"
                            />
                        </template>
                    </RArray>
                </template>
                <div class="col-span-full flex flex-row gap-2">
                    <button
                        type="submit"
                        class="rounded bg-primary px-3 py-1 text-white"
                    >
                        submit (valida)
                    </button>
                    <button
                        type="reset"
                        class="rounded bg-neutral px-3 py-1 text-white"
                    >
                        reset
                    </button>
                </div>
            </RForm>

            <div class="flex flex-row gap-4">
                <pre
                    data-allow-mismatch
                    class="text-xs"
                >
data: {{ full.data.value }}</pre
                >
                <pre
                    data-allow-mismatch
                    class="text-xs"
                >
zod parse: {{ full.parseResult }}</pre
                >
            </div>

            <button
                type="button"
                class="rounded bg-primary px-3 py-1 text-white"
                @click="runParse"
            >
                rodar rules.safeParse(data.value)
            </button>
        </div>

        <div class="flex flex-col gap-3">
            <h2 class="text-2xl font-bold">Modo 2 — só zod (sem UI gerada)</h2>
            <p class="text-sm opacity-60">
                data e rules tipados; usuário monta o form manualmente.
            </p>
            <RForm
                v-model="zodOnly.data.value"
                class="grid grid-cols-3 gap-4"
            >
                <RText name="name" />
                <RNumber name="years" />
            </RForm>
            <pre
                data-allow-mismatch
                class="text-xs"
            >
data: {{ zodOnly.data.value }}</pre
            >
        </div>

        <div class="flex flex-col gap-3">
            <h2 class="text-2xl font-bold">Modo 3 — só TS (sem runtime)</h2>
            <p class="text-sm opacity-60">só tipa data; sem rules, sem schema.</p>
            <RForm
                v-model="tsOnly.data.value"
                class="grid grid-cols-3 gap-4"
            >
                <RText name="name" />
                <RNumber name="years" />
            </RForm>
            <pre
                data-allow-mismatch
                class="text-xs"
            >
                data: {{ tsOnly.data.value }}</pre
            >
        </div>
    </section>
</template>

<script setup lang="ts">
    import { ref } from "vue";
    import { z } from "zod";

    const full = (() => {
        const result = useRForm({
            name: {
                type: "text",
                label: "Nome",
                rule: z.string().min(2, "mínimo 2 caracteres")
            },
            years: {
                type: "number",
                label: "Idade",
                min: 18,
                max: 30,
                rule: z.number().min(18, "mínimo 18").max(30, "máximo 30")
            },
            payload: {
                type: "object",
                label: "Payload",
                children: {
                    var: {
                        type: "text",
                        label: "var interna",
                        rule: z.string()
                    },
                    name: {
                        type: "text",
                        label: "Nome",
                        rule: z.string().min(2, "mínimo 2 caracteres")
                    },
                    years: {
                        type: "number",
                        label: "Idade",
                        min: 18,
                        max: 30,
                        rule: z.number().min(18, "mínimo 18").max(30, "máximo 30")
                    }
                }
            },
            users: {
                slot: "users",
                rule: z.array(z.string()).min(1, "ao menos 1 usuário")
            }
        });

        const parseResult = ref<unknown>(null);

        return {
            ...result,
            parseResult
        };
    })();

    const zodOnly = useRForm({
        name: z.string(),
        years: z.number().min(18).max(30),
        payload: z.object({ var: z.string() })
    });

    const tsOnly = useRForm<{
        name?: string;
        years?: number;
    }>();

    const handleSubmit1 = (data: unknown) => {
        console.log("submit data:", data);
    };

    const runParse = () => {
        full.parseResult.value = full.rules.safeParse(full.data.value);
    };
</script>
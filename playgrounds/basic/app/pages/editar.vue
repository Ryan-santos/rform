<template>
    <div class="flex flex-col gap-4">
        <Card
            title="Uma tela que abre preenchida"
            description="default semeia o campo quando o model está vazio; modelValue é o valor controlado. Numa tela de edição quem manda é o segundo."
        >
            <div class="mb-4 flex flex-row flex-wrap gap-2">
                <button
                    v-for="registro in registros"
                    :key="registro.id"
                    type="button"
                    class="cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors"
                    :class="
                        registro.id === atual
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-contrast/10 text-contrast/60 hover:text-primary'
                    "
                    @click="carregar(registro.id)"
                >
                    {{ registro.nome }}
                </button>
            </div>

            <RForm
                v-model="data"
                class="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
                <RText
                    name="nome"
                    label="form.nome"
                    required
                />
                <RText
                    name="email"
                    label="form.email"
                    rule="email"
                />
                <RText
                    name="cpf"
                    label="form.cpf"
                    mask="brCpf"
                />
                <RSelect
                    name="uf"
                    label="form.uf"
                    placeholder="form.selecione"
                    :options="ufs"
                />
            </RForm>

            <div class="flex flex-row flex-wrap items-center gap-3 pt-4">
                <button
                    type="button"
                    class="cursor-pointer rounded-lg border border-contrast/10 px-4 py-2 text-sm"
                    @click="carregar(atual)"
                >
                    {{ $t("editar.descartar") }}
                </button>

                <span
                    class="rounded-lg px-2 py-1 font-mono text-xs"
                    :class="sujo ? 'bg-warn/15 text-warn' : 'bg-success/15 text-success'"
                >
                    {{ sujo ? $t("editar.sujo") : $t("editar.limpo") }}
                </span>
            </div>
        </Card>

        <Card title="model">
            <Json :value="data" />
        </Card>

        <Card :title="$t('editar.original')">
            <Json :value="original" />
        </Card>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref } from "vue";

    const ufs = ["SP", "RJ", "MG", "BA", "RS"];

    type Registro = {
        id: number;
        nome: string;
        email: string;
        cpf: string;
        uf: string;
    };

    const registros: Registro[] = [
        { id: 1, nome: "Ana Oliveira", email: "ana@empresa.com", cpf: "123.456.789-09", uf: "SP" },
        {
            id: 2,
            nome: "Pedro Santos",
            email: "pedro@empresa.com",
            cpf: "987.654.321-00",
            uf: "RJ"
        },
        { id: 3, nome: "Maria Souza", email: "maria@empresa.com", cpf: "111.222.333-44", uf: "MG" }
    ];

    const atual = ref(1);

    const original = ref<Registro>({ ...(registros[0] as Registro) });

    const data = ref<Record<string, unknown>>({ ...(registros[0] as Registro) });

    const carregar = (id: number) => {
        const registro = registros.find((item) => item.id === id) as Registro;

        atual.value = id;
        original.value = { ...registro };
        // Objeto novo, e não mutação: é o que faz o campo enxergar a troca.
        data.value = { ...registro };
    };

    const sujo = computed(() => JSON.stringify(data.value) !== JSON.stringify(original.value));
</script>
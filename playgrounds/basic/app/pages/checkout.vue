<template>
    <Scenario
        title="cadastro de ponta a ponta"
        :value="data"
    >
        <RForm
            v-model="data"
            @submit="submit"
            class="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
            <RText
                name="nome"
                label="form.nome"
                placeholder="form.nomeCompleto"
                required
                rule="required"
            />
            <RText
                name="cpf"
                label="form.cpf"
                mask="brCpf"
                required
                rule="brCpf"
                :loading="checando"
                :error="erroCpf"
            />
            <RText
                name="email"
                label="form.email"
                placeholder="form.emailExemplo"
                rule="email"
            />
            <RText
                name="telefone"
                label="form.telefone"
                mask="brCelular"
            />
            <RDate
                name="nascimento"
                label="form.nascimento"
            />
            <RSelect
                name="uf"
                label="form.uf"
                placeholder="form.selecione"
                :options="ufs"
                search
            />

            <RObject
                name="endereco"
                label="form.endereco"
                class="md:col-span-2"
            >
                <RText
                    name="cep"
                    label="form.cep"
                    mask="brCep"
                    rule="brCep"
                />
                <RText
                    name="rua"
                    label="form.rua"
                />
                <RNumber
                    name="numero"
                    label="form.numero"
                />
            </RObject>

            <RArray
                v-slot="{ index }"
                name="socios"
                label="empresa.socios"
                class="md:col-span-2"
                :min="1"
            >
                <RObject :name="index">
                    <RText
                        name="nome"
                        label="form.nome"
                    />
                    <RText
                        name="cpf"
                        label="form.cpf"
                        mask="brCpf"
                        rule="brCpf"
                    />
                </RObject>
            </RArray>

            <RSwitch
                name="aceite"
                placeholder="form.aceiteTermos"
                required
                class="md:col-span-2"
                :rule="({ value }) => (value === true ? undefined : $t('checkout.aceite'))"
            />

            <div class="flex flex-row flex-wrap items-center gap-2 md:col-span-2">
                <button
                    type="submit"
                    class="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                    :disabled="enviando"
                >
                    {{ enviando ? $t("checkout.enviando") : $t("form.enviar") }}
                </button>
                <button
                    type="reset"
                    class="cursor-pointer rounded-lg border border-contrast/10 px-4 py-2 text-sm"
                >
                    {{ $t("checkout.reset") }}
                </button>

                <span
                    v-if="parse"
                    class="rounded-lg bg-background-100 px-2 py-1 font-mono text-xs"
                >
                    {{ parse }}
                </span>
            </div>
        </RForm>
    </Scenario>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    const { t } = useI18n();

    const ufs = ["SP", "RJ", "MG", "BA", "RS", "PE", "CE", "PR", "SC", "GO"];

    type Checkout = {
        nome?: string;
        cpf?: string;
        email?: string;
        telefone?: string;
        nascimento?: string;
        uf?: string;
        endereco?: { cep?: string; rua?: string; numero?: number };
        socios?: { nome?: string; cpf?: string }[];
        aceite?: boolean;
    };

    const { data } = useRForm<Checkout>();

    const enviando = ref(false);

    const checando = ref(false);

    const parse = ref("");

    // O erro que a rule não tem como saber: ele vem do servidor, e entra pela prop
    // `error` do campo — o mesmo canal do RUtilsError, sem passar por validação.
    const erroCpf = ref<string | undefined>(undefined);

    const submit = async () => {
        enviando.value = true;
        checando.value = true;
        erroCpf.value = undefined;

        await new Promise((resolve) => setTimeout(resolve, 900));

        checando.value = false;
        enviando.value = false;

        if (data.value.cpf === "111.111.111-11") {
            erroCpf.value = t("checkout.cpfDuplicado");
            parse.value = t("checkout.recusado");

            return;
        }

        parse.value = t("checkout.aceito");
    };
</script>
<template>
    <div class="flex flex-col gap-6">
        <Scenario
            title="login"
            :value="login"
        >
            <RForm
                v-model="login"
                class="flex flex-col gap-4"
                @submit="entrar"
            >
                <RText
                    name="usuario"
                    label="autocomplete.usuario"
                    autocomplete="username"
                />
                <RText
                    name="senha"
                    label="autocomplete.senha"
                    autocomplete="current-password"
                />

                <button
                    type="submit"
                    class="w-fit cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm text-white"
                >
                    {{ $t("autocomplete.entrar") }}
                </button>

                <p
                    v-if="enviado"
                    class="font-mono text-xs text-contrast/40"
                >
                    {{ enviado }}
                </p>
            </RForm>
        </Scenario>

        <Scenario
            title="nova senha"
            :value="troca"
        >
            <RForm
                v-model="troca"
                class="flex flex-col gap-4"
            >
                <RText
                    name="atual"
                    label="autocomplete.senha"
                    autocomplete="current-password"
                />
                <RText
                    name="nova"
                    label="autocomplete.novaSenha"
                    autocomplete="new-password"
                />
                <RText
                    name="confirmacao"
                    label="autocomplete.confirmarSenha"
                    autocomplete="new-password"
                />
            </RForm>
        </Scenario>

        <Scenario
            title="código"
            :value="verificacao"
        >
            <RForm
                v-model="verificacao"
                class="flex flex-col gap-4"
            >
                <RPin
                    name="codigo"
                    label="autocomplete.codigo"
                    autocomplete="one-time-code"
                    :length="6"
                />
            </RForm>
        </Scenario>

        <Scenario
            title="endereço"
            :value="endereco"
        >
            <RForm
                v-model="endereco"
                class="flex flex-col gap-4"
            >
                <RText
                    name="cep"
                    label="form.cep"
                    mask="brCep"
                    autocomplete="postal-code"
                />
                <RText
                    name="cidade"
                    label="autocomplete.cidade"
                    autocomplete="address-level2"
                />
                <RTextarea
                    name="logradouro"
                    label="form.endereco"
                    autocomplete="street-address"
                />
            </RForm>
        </Scenario>

        <Scenario
            title="pagamento"
            :value="cartao"
        >
            <RForm
                v-model="cartao"
                class="grid grid-cols-1 gap-4 md:grid-cols-3"
            >
                <RText
                    name="titular"
                    label="autocomplete.titular"
                    autocomplete="cc-name"
                    class="md:col-span-3"
                />
                <RText
                    name="numero"
                    label="autocomplete.cartao"
                    mask="#### #### #### ####"
                    autocomplete="cc-number"
                    class="md:col-span-3"
                />
                <RNumber
                    name="mes"
                    label="autocomplete.mes"
                    autocomplete="cc-exp-month"
                />
                <RNumber
                    name="ano"
                    label="autocomplete.ano"
                    autocomplete="cc-exp-year"
                />
                <RNumber
                    name="cvv"
                    label="autocomplete.cvv"
                    autocomplete="cc-csc"
                />
            </RForm>
        </Scenario>

        <Scenario
            title="nascimento"
            :value="perfil"
        >
            <RForm
                v-model="perfil"
                class="flex flex-col gap-4"
            >
                <RDate
                    name="nascimento"
                    label="form.nascimento"
                    autocomplete="bday"
                />
                <RHour
                    name="horario"
                    label="autocomplete.horario"
                    autocomplete="off"
                />
            </RForm>
        </Scenario>
    </div>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    const login = ref<Record<string, unknown>>({});
    const troca = ref<Record<string, unknown>>({});
    const verificacao = ref<Record<string, unknown>>({});
    const endereco = ref<Record<string, unknown>>({});
    const cartao = ref<Record<string, unknown>>({});
    const perfil = ref<Record<string, unknown>>({});

    const enviado = ref("");

    // No RHour o único token com sentido é `off`: não há hora a preencher.

    // O gerenciador de senha só oferece gravar depois de um submit.
    const entrar = () => {
        enviado.value = new Date().toISOString().slice(11, 19);
    };
</script>
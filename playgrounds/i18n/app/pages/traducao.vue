<template>
    <div class="flex flex-col gap-6">
        <Scenario
            title="chave, literal e params"
            :value="data"
        >
            <RForm
                v-model="data"
                class="flex flex-col gap-4"
            >
                <RText
                    name="titular"
                    label="traducao.titular"
                />
                <RText
                    name="apelido"
                    label="~~Apelido (literal, não traduz)"
                />
                <RText
                    name="bio"
                    label="traducao.titular"
                    :description="{ key: 'traducao.ajudaMax', params: { n: 30 } }"
                />
                <RText
                    name="email"
                    label="form.email"
                    placeholder="form.emailExemplo"
                />
            </RForm>
        </Scenario>

        <Scenario
            title="mensagens do módulo, e a prop text"
            :value="modulo"
        >
            <RForm
                v-model="modulo"
                class="flex flex-col gap-4"
            >
                <RArray
                    v-slot="{ index }"
                    name="socios"
                    label="traducao.socios"
                >
                    <RText :name="index" />
                </RArray>

                <RArray
                    v-slot="{ index }"
                    name="contatos"
                    label="~~Contatos"
                    :text="{ button: '~~Adicionar contato' }"
                >
                    <RText :name="index" />
                </RArray>

                <RSelect
                    name="uf"
                    label="form.uf"
                    :options="['SP', 'RJ', 'MG']"
                    search
                />
            </RForm>
        </Scenario>

        <Scenario
            title="trRule, plural e o override do app"
            :value="rules"
        >
            <RForm
                v-model="rules"
                class="flex flex-col gap-4"
            >
                <RText
                    name="curto"
                    label="~~min 1"
                    :rule="{ name: 'min', min: 1 }"
                />
                <RText
                    name="longo"
                    label="~~min 5"
                    :rule="{ name: 'min', min: 5 }"
                />
                <RText
                    name="obrigatorio"
                    label="~~required"
                    rule="required"
                />

                <button
                    type="submit"
                    class="w-fit cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm text-white"
                >
                    {{ $t("form.enviar") }}
                </button>
            </RForm>
        </Scenario>
    </div>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    const data = ref<Record<string, unknown>>({});

    const modulo = ref<Record<string, unknown>>({});

    // `min` tem a mensagem sobrescrita pelo pack do app, sob a chave `rform`;
    // `required` vem do preset do usuário em `app/rform/presets/rules`.
    const rules = ref<Record<string, unknown>>({});
</script>
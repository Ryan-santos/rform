<template>
    <div class="flex w-fit flex-row gap-1 rounded-xl bg-background-100 p-1">
        <button
            v-for="option in tipos"
            :key="option.id"
            type="button"
            class="cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-colors duration-300"
            :class="
                tipo === option.id ? 'bg-primary text-white' : 'text-contrast/60 hover:text-primary'
            "
            @click="tipo = option.id"
        >
            {{ $t(option.label) }}
        </button>
    </div>

    <RForm
        v-model="data"
        class="grid grid-cols-1 gap-4 @md:grid-cols-2"
    >
        <RDynamic :schema="active.schema" />
    </RForm>
</template>

<script setup lang="ts">
    import { computed, ref } from "vue";

    const tipos = [
        { id: "pj", label: "demo.dynamic.pj" },
        { id: "pf", label: "demo.dynamic.pf" }
    ];

    const tipo = ref("pj");

    const pj = useRForm({
        empresa: { type: "text", label: "demo.dynamic.razaoSocial" },
        cnpj: { type: "text", label: "~~CNPJ", mask: "brCnpj", rule: "brCnpj" }
    });

    const pf = useRForm({
        nome: { type: "text", label: "demo.common.nome" },
        cpf: { type: "text", label: "~~CPF", mask: "brCpf", rule: "brCpf" }
    });

    // Dois `useRForm`, um vivo: o schema é um valor simples, então trocar qual deles
    // o `RDynamic` recebe já troca o formulário.
    const active = computed(() => (tipo.value === "pj" ? pj : pf));

    const data = computed({
        get: () => active.value.data.value as Record<string, unknown>,
        set: (value) => {
            active.value.data.value = value as never;
        }
    });

    // O painel de model do `<Demo>` lê daqui: este exemplo monta o próprio `RForm`.
    defineExpose({ data });
</script>
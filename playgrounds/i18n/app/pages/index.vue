<template>
    <Scenario
        title="troque o idioma no cabeçalho"
        :value="data"
    >
        <RForm
            v-model="data"
            class="flex flex-col gap-4"
        >
            <RText
                name="nome"
                label="form.nome"
                placeholder="form.nomeCompleto"
            />
            <RSelect
                name="uf"
                label="form.uf"
                placeholder="form.selecione"
                :options="['SP', 'RJ', 'MG']"
                search
            />
            <RDate
                name="nascimento"
                label="form.nascimento"
            />
        </RForm>
    </Scenario>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    // O `RDate` reformata ao trocar de locale — o pattern sai de
    // `tr("rform.formats.date")` — e o model continua ISO.
    const data = ref<Record<string, unknown>>({});
</script>
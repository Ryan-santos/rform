<template>
    <DemoPage
        title="Hour"
        tag="RHour"
        description="Horário no formato HH:MM, com mask eager e roletas de hora e minuto. O model é string em modo simples e array de duas strings em range."
        :source
    >
        <Demo
            id="basico"
            title="básico"
            description="Digite ou use as setas. Hora é limitada a 0–23 e minuto a 0–59 na própria escrita."
        >
            <RHour
                name="horario"
                placeholder="horário"
            />
        </Demo>

        <Demo
            id="label"
            title="label e description"
        >
            <RHour
                name="abertura"
                label="Abertura"
                placeholder="que horas abre"
                description="Horário local do estabelecimento."
            />
        </Demo>

        <Demo
            id="range"
            title="range"
            description="Dois horários no mesmo wrapper. O model vira [início, fim]."
        >
            <RHour
                name="atendimento"
                label="Janela de atendimento"
                placeholder="das … às …"
                range
            />
        </Demo>

        <Demo
            id="default"
            title="default"
        >
            <RHour
                name="comDefault"
                label="Já vem preenchido"
                default="08:30"
            />
            <RHour
                name="rangeDefault"
                label="Range já preenchido"
                :default="['08:00', '18:00']"
                range
            />
        </Demo>

        <Demo
            id="estados"
            title="required, loading e error"
        >
            <RHour
                name="obrigatorio"
                label="Obrigatório"
                required
                rule="required"
            />
            <RHour
                name="carregando"
                label="Carregando"
                loading
            />
            <RHour
                name="comErro"
                label="Erro manual"
                error="Fora do horário comercial."
            />
        </Demo>

        <DemoUi component="Hour" />

        <DemoActions />
    </DemoPage>
</template>

<script setup lang="ts">
    import source from "./hour.vue?raw";
</script>

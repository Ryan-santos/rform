<template>
    <DemoPage
        title="Calendar"
        tag="RCalendar"
        description="O mesmo calendário que o RDate abre no popover, agora sempre visível. Aceita os mesmos mode, time e disable."
        :source
    >
        <Demo
            id="single"
            title="mode single (padrão)"
            ui="grid gap-4 md:grid-cols-2"
        >
            <RCalendar
                name="agenda"
                label="~~Agenda"
            />
        </Demo>

        <Demo
            id="range"
            title="mode range"
            description="O model vira [início, fim]. Clique numa data e depois na outra."
            ui="grid gap-4 md:grid-cols-2"
        >
            <RCalendar
                name="ferias"
                label="~~Período de férias"
                mode="range"
            />
        </Demo>

        <Demo
            id="multiple"
            title="mode multiple"
            description="Array de datas independentes; clicar de novo remove."
            ui="grid gap-4 md:grid-cols-2"
        >
            <RCalendar
                name="feriados"
                label="~~Feriados"
                mode="multiple"
            />
        </Demo>

        <Demo
            id="time"
            title="time"
            description="Acrescenta hora ao valor, aqui combinado com range."
            ui="grid gap-4 md:grid-cols-2"
        >
            <RCalendar
                name="janela"
                label="~~Janela com hora"
                mode="range"
                time
            />
        </Demo>

        <Demo
            id="disable"
            title="disable"
            description="Mesma DisableSpec do RDate: before, after, dates e between."
            ui="grid gap-4 md:grid-cols-2"
        >
            <RCalendar
                name="restrito"
                label="~~Só 2026, sem feriados"
                :disable="{
                    before: '2026-01-01',
                    after: '2026-12-31',
                    dates: ['2026-04-21', '2026-05-01', '2026-09-07']
                }"
            />
            <RCalendar
                name="semRecesso"
                label="~~Sem o recesso de fim de ano"
                mode="range"
                :disable="{
                    between: ['2026-12-20', '2026-12-31']
                }"
            />
        </Demo>

        <Demo
            id="estados"
            title="required e error"
            ui="grid gap-4 md:grid-cols-2"
        >
            <RCalendar
                name="obrigatorio"
                label="~~Obrigatório"
                required
                rule="required"
            />
            <RCalendar
                name="comErro"
                label="~~Erro manual"
                error="Essa data já está ocupada."
            />
        </Demo>

        <DemoUi component="Calendar" />

        <DemoActions />
    </DemoPage>
</template>

<script setup lang="ts">
    import source from "./calendar.vue?raw";
</script>
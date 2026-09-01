<template>
    <DemoPage
        title="Date"
        tag="RDate"
        description="Campo de data digitável com calendário em popover. O model muda de forma conforme o mode: string em single, tupla em range, array em multiple."
        :source
    >
        <Demo
            id="single"
            title="mode single (padrão)"
            description="Uma data. O model é a string ISO — dá pra digitar direto no campo, a mask cuida do formato."
        >
            <RDate
                name="nascimento"
                label="Aniversário"
                placeholder="quando você nasceu"
            />
        </Demo>

        <Demo
            id="range"
            title="mode range"
            description="Dois campos no mesmo wrapper. O model vira [início, fim] — repare que a tupla existe no JSON antes mesmo da segunda data."
        >
            <RDate
                name="periodo"
                label="Período"
                placeholder="data de execução"
                mode="range"
            />
        </Demo>

        <Demo
            id="multiple"
            title="mode multiple"
            description="Datas avulsas, sem relação entre elas. O model é um array de strings."
        >
            <RDate
                name="avulsas"
                label="Datas avulsas"
                placeholder="escolha quantas quiser"
                mode="multiple"
            />
        </Demo>

        <Demo
            id="time"
            title="time"
            description="Acrescenta hora ao valor. Combina com qualquer mode."
        >
            <RDate
                name="agendamento"
                label="Agendamento"
                placeholder="dia e hora"
                time
            />
            <RDate
                name="janela"
                label="Janela de execução"
                placeholder="de quando até quando"
                mode="range"
                time
            />
        </Demo>

        <Demo
            id="default"
            title="default"
        >
            <RDate
                name="comDefault"
                label="Já vem preenchida"
                default="2003-11-24"
            />
        </Demo>

        <Demo
            id="disable-limites"
            title="disable — before e after"
            description="Fecha tudo fora do intervalo. As duas chaves são independentes."
        >
            <RDate
                name="somenteEsteAno"
                label="Só em 2026"
                placeholder="dentro do ano"
                :disable="{
                    before: '2026-01-01',
                    after: '2026-12-31'
                }"
            />
        </Demo>

        <Demo
            id="disable-datas"
            title="disable — dates"
            description="Lista de dias fechados, sem mexer no resto do calendário."
        >
            <RDate
                name="semFeriado"
                label="Evitando feriados"
                placeholder="dia útil"
                :disable="{
                    before: '2026-01-01',
                    after: '2026-12-31',
                    dates: ['2026-04-21', '2026-05-01', '2026-09-07']
                }"
            />
        </Demo>

        <Demo
            id="disable-between"
            title="disable — between"
            description="Fecha um trecho no meio. Útil para recesso, bloqueio de agenda, freeze de deploy."
        >
            <RDate
                name="semRecesso"
                label="Evitando o recesso"
                placeholder="antes ou depois das festas"
                mode="range"
                :disable="{
                    between: ['2026-12-20', '2026-12-31']
                }"
            />
        </Demo>

        <Demo
            id="estados"
            title="required, loading e error"
        >
            <RDate
                name="obrigatoria"
                label="Obrigatória"
                required
                rule="required"
            />
            <RDate
                name="carregando"
                label="Carregando"
                loading
            />
            <RDate
                name="comErro"
                label="Erro manual"
                error="Data fora do período de inscrição."
            />
        </Demo>

        <DemoUi component="Date" />

        <DemoActions />
    </DemoPage>
</template>

<script setup lang="ts">
    import source from "./date.vue?raw";
</script>

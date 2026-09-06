<template>
    <RDate
        name="semFeriado"
        label="demo.date.evitandoFeriados"
        placeholder="demo.date.diaUtil"
        :disable="{
            before: '2026-01-01',
            after: '2026-12-31',
            dates: ['2026-04-21', '2026-05-01', '2026-09-07']
        }"
    />
</template>
<template>
    <RDate
        name="somenteEsteAno"
        label="demo.date.soEm2026"
        placeholder="demo.date.dentroDoAno"
        :disable="{
            before: '2026-01-01',
            after: '2026-12-31'
        }"
    />
</template>
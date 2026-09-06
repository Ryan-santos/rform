<template>
    <RDate
        name="semRecesso"
        label="demo.date.evitandoRecesso"
        placeholder="demo.date.antesOuDepois"
        mode="range"
        :disable="{
            between: ['2026-12-20', '2026-12-31']
        }"
    />
</template>
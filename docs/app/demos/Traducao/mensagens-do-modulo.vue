<template>
    <RArray
        v-slot="{ index }"
        name="socios"
        label="demo.array.socios"
    >
        <RText :name="index" />
    </RArray>

    <RSelect
        name="uf"
        label="demo.select.uf"
        :options="['SP', 'RJ', 'MG']"
        search
    />
</template>
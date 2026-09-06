<template>
    <RSelect
        v-slot="{ selected }"
        name="cor"
        placeholder="demo.select.cor"
        :options="{
            blue: 'azul',
            red: 'vermelho',
            green: 'verde'
        }"
    >
        <span
            class="block size-3 rounded-full"
            :style="`background-color: ${selected.value}`"
        />
        <p>{{ selected.label }}</p>
    </RSelect>
</template>
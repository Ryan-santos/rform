<template>
    <RArray
        v-slot="{ index }"
        name="contatos"
        label="demo.traducao.contatos"
        :text="{ button: 'demo.traducao.adicionarContato' }"
    >
        <RText :name="index" />
    </RArray>
</template>
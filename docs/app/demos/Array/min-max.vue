<template>
    <RArray
        v-slot="{ index }"
        name="telefones"
        label="demo.array.deDoisAQuatro"
        :min="2"
        :max="4"
    >
        <RText
            :name="index"
            placeholder="demo.array.telefone"
            mask="brTelefone"
        />
    </RArray>
</template>
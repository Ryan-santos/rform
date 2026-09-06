<template>
    <RArray
        v-slot="{ index: setor }"
        name="setores"
        label="demo.array.setores"
        :text="{ button: 'demo.array.novoSetor' }"
    >
        <RArray
            v-slot="{ index }"
            :name="setor"
            :text="{ button: 'demo.array.novoIntegrante' }"
        >
            <RText
                :name="index"
                placeholder="demo.array.integrante"
            />
        </RArray>
    </RArray>
</template>
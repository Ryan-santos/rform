<template>
    <RArray
        v-slot="{ index }"
        name="socios"
        label="demo.array.socios"
        :min="1"
    >
        <RObject :name="index">
            <RText
                name="nome"
                label="demo.common.nome"
                placeholder="demo.common.nomeCompleto"
            />
            <RText
                name="cpf"
                label="~~CPF"
                mask="brCpf"
                rule="brCpf"
            />
            <RNumber
                name="participacao"
                label="demo.array.participacao"
                :max="100"
            />
        </RObject>
    </RArray>
</template>
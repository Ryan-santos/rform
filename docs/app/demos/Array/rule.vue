<template>
    <RArray
        v-slot="{ index }"
        name="convidados"
        label="demo.array.peloMenosDois"
        :rule="{ name: 'min', min: 2 }"
    >
        <RText
            :name="index"
            placeholder="demo.array.convidado"
        />
    </RArray>

    <DemoActions />
</template>
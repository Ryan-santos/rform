<template>
    <RArray
        v-slot="{ index }"
        name="tags"
        label="demo.array.tags"
        :text="{ button: 'demo.array.novaTag' }"
    >
        <RText
            :name="index"
            placeholder="demo.array.tag"
        />
    </RArray>
</template>
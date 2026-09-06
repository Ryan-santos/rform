<template>
    <RArray
        v-slot="{ index }"
        name="emails"
        label="demo.array.emails"
    >
        <RText
            :name="index"
            placeholder="demo.array.email"
            rule="email"
        />
    </RArray>
</template>
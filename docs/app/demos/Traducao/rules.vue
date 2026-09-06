<template>
    <RText
        name="curto"
        label="~~{ name: 'min', min: 1 }"
        :rule="{ name: 'min', min: 1 }"
    />
    <RText
        name="longo"
        label="~~{ name: 'min', min: 5 }"
        :rule="{ name: 'min', min: 5 }"
    />
    <RText
        name="obrigatorio"
        label="~~rule=&quot;required&quot;"
        rule="required"
    />

    <DemoActions />
</template>
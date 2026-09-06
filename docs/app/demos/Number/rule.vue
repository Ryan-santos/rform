<template>
    <RNumber
        name="ruleMin"
        label="~~{ name: 'min', min: 18 }"
        :rule="{ name: 'min', min: 18 }"
    />
    <RNumber
        name="ruleMax"
        label="~~{ name: 'max', max: 30 }"
        :rule="{ name: 'max', max: 30 }"
    />
    <RNumber
        name="ruleFaixa"
        label="~~[min 18, max 30]"
        :rule="[
            { name: 'min', min: 18 },
            { name: 'max', max: 30 }
        ]"
    />
</template>
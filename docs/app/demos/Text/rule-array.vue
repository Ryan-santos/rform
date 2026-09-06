<template>
    <RText
        name="ruleArray"
        label="~~required + min 3"
        :rule="['required', { name: 'min', min: 3 }]"
    />
</template>
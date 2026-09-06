<template>
    <RText
        name="dinheiro"
        label='~~mask="dinheiro"'
        mask="dinheiro"
    />
    <RText
        name="inscEst"
        label="~~{ name: 'brInscEst', uf: 'SP' }"
        :rule="{ name: 'brInscEst', uf: 'SP' }"
    />

    <DemoActions />
</template>
<template>
    <RText
        name="dinheiro"
        label="~~mask=&quot;dinheiro&quot;"
        mask="dinheiro"
    />
    <RText
        name="inscEst"
        label="~~{ name: 'brInscEst', uf: 'SP' }"
        :rule="{ name: 'brInscEst', uf: 'SP' }"
    />

    <DemoActions />
</template>
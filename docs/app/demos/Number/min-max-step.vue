<template>
    <RNumber
        name="intervalo"
        label="~~min 20, max 100, step 20"
        :min="20"
        :max="100"
        :step="20"
    />
    <RNumber
        name="decimal"
        label="~~step 0.5"
        :step="0.5"
    />
</template>
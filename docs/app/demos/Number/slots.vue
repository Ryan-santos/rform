<template>
    <RNumber
        name="delay"
        placeholder="demo.number.delay"
    >
        <template #trailing> {{ $t("demo.number.segundos") }} </template>
    </RNumber>
    <RNumber
        name="preco"
        placeholder="demo.number.preco"
    >
        <template #leading> R$ </template>
    </RNumber>
</template>
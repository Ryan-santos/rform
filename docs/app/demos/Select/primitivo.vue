<template>
    <RSelect
        name="primitivo"
        placeholder="demo.common.selecione"
        :options="[1, 2, 3]"
    />
    <RSelect
        name="primitivoTexto"
        label="~~['pequeno', 'médio', 'grande']"
        placeholder="demo.common.selecione"
        :options="['pequeno', 'médio', 'grande']"
    />
</template>
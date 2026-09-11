<template>
    <RSelect
        name="ufCurta"
        label="demo.select.semBusca"
        placeholder="demo.common.selecione"
        :options="['SP', 'RJ', 'MG']"
    />
    <RSelect
        name="uf"
        label="demo.select.comBusca"
        placeholder="demo.common.selecione"
        :options="['SP', 'RJ', 'MG', 'BA', 'RS', 'PE', 'CE', 'PR', 'SC', 'GO']"
        search
    />
</template>
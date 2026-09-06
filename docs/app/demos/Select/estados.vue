<template>
    <RSelect
        name="obrigatorio"
        label="demo.common.obrigatorio"
        placeholder="demo.common.selecione"
        :options="['a', 'b']"
        required
        rule="required"
    />
    <RSelect
        name="carregando"
        label="demo.common.carregando"
        placeholder="demo.common.selecione"
        :options="['a', 'b']"
        loading
    />
    <RSelect
        name="comErro"
        label="demo.common.erroManual"
        placeholder="demo.common.selecione"
        :options="['a', 'b']"
        :error="$t('demo.select.erro')"
    />
</template>
<template>
    <RFile
        name="obrigatorio"
        label="demo.common.obrigatorio"
        accept="png, jpg"
        required
        rule="required"
    />
    <RFile
        name="carregando"
        label="demo.common.carregando"
        accept="png, jpg"
        loading
    />
    <RFile
        name="comErro"
        label="demo.common.erroManual"
        accept="png, jpg"
        error="demo.file.erro"
    />
</template>
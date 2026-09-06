<template>
    <RText
        name="erroPadrao"
        label="demo.ui.erroPadrao"
        :error="$t('demo.ui.erroPadraoMensagem')"
    />
    <RText
        name="erroRosa"
        label="demo.ui.erroReestilizado"
        :error="$t('demo.ui.erroReestilizadoMensagem')"
        :ui="{
            Utils: {
                Error: {
                    container: 'text-secondary text-xs italic tracking-normal font-normal ml-0'
                }
            }
        }"
    />
</template>
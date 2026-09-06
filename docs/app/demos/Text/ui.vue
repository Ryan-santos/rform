<template>
    <RText
        name="uiOverride"
        label="demo.text.erroRosa"
        :error="$t('demo.text.erroClasseTrocada')"
        :ui="{
            Utils: {
                Error: {
                    container: 'text-pink-400'
                }
            }
        }"
    />
</template>
<template>
    <RText
        name="uiOverride"
        label="demo.text.erroRosa"
        error="demo.text.erroClasseTrocada"
        :ui="{
            Utils: {
                Error: {
                    container: 'text-pink-400'
                }
            }
        }"
    />
</template>
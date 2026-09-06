<template>
    <RText
        name="padrao"
        label="demo.ui.padrao"
        placeholder="demo.ui.padraoPlaceholder"
    />
    <RText
        name="comUi"
        label="demo.ui.comUi"
        placeholder="demo.ui.comUiPlaceholder"
        :ui="{
            group: {
                field: {
                    input: 'p-6 text-lg'
                }
            }
        }"
    />
</template>
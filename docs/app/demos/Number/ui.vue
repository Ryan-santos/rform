<template>
    <RNumber
        name="uiOverride"
        label="demo.number.minutos"
        :ui="{
            group: {
                wrapper: {
                    trailing: 'opacity-50'
                }
            }
        }"
    >
        <template #trailing> {{ $t("demo.number.minutos") }} </template>
    </RNumber>
</template>
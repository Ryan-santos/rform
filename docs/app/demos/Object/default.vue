<template>
    <RObject
        name="preferencias"
        label="demo.object.preferencias"
    >
        <RSwitch
            name="newsletter"
            placeholder="demo.object.newsletter"
            :default="true"
        />
        <RSelect
            name="idioma"
            label="demo.object.idioma"
            :options="{ pt: 'Português', en: 'English' }"
            default="pt"
        />
    </RObject>
</template>
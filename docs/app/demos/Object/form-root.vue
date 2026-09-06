<template>
    <RText
        name="senha"
        label="demo.object.senhaFora"
    />
    <RObject
        name="confirmacao"
        label="demo.object.confirmacao"
    >
        <RText
            name="senha"
            label="demo.object.repitaSenha"
            :rule="
                ({ value, form }) =>
                    value && value !== form?.senha ? $t('demo.object.naoConferem') : undefined
            "
        />
    </RObject>

    <DemoActions />
</template>
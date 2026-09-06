<template>
    <RSwitch
        name="aceite"
        label="demo.switch.termos"
        placeholder="demo.switch.liEAceito"
        description="demo.switch.semIssoNaoCria"
        required
        :rule="({ value }) => (value === true ? undefined : $t('demo.switch.precisaAceitar'))"
    />
    <RSwitch
        name="comErro"
        placeholder="demo.common.erroManual"
        :error="$t('demo.switch.erro')"
    />
</template>
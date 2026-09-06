<template>
    <RColor
        name="ruleFn"
        label="demo.color.naoPodePreto"
        :rule="({ value }) => (value === '#000000' ? $t('demo.color.escolhaUmaCor') : undefined)"
    />
</template>
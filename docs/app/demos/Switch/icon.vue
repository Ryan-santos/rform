<template>
    <RSwitch
        name="iconPadrao"
        placeholder="~~icon"
        icon
    />
    <RSwitch
        name="iconCustom"
        placeholder='~~:icon="{ true, false }"'
        :icon="{
            true: 'twemoji:check-mark-button',
            false: 'twemoji:cross-mark'
        }"
    />
    <RSwitch
        name="semIcon"
        placeholder="demo.switch.semIcon"
    />
</template>
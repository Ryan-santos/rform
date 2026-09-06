<template>
    <RSwitch
        name="iconPadrao"
        placeholder="~~icon"
        icon
    />
    <RSwitch
        name="iconCustom"
        placeholder="~~:icon=&quot;{ true, false }&quot;"
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
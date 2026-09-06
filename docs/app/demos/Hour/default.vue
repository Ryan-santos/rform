<template>
    <RHour
        name="comDefault"
        label="~~default=&quot;08:30&quot;"
        default="08:30"
    />
    <RHour
        name="rangeDefault"
        label="~~:default=&quot;['08:00', '18:00']&quot;"
        :default="['08:00', '18:00']"
        range
    />
</template>
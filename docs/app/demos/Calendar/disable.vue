<template>
    <RCalendar
        name="restrito"
        label="demo.calendar.restrito"
        :disable="{
            before: '2026-01-01',
            after: '2026-12-31',
            dates: ['2026-04-21', '2026-05-01', '2026-09-07']
        }"
    />
    <RCalendar
        name="semRecesso"
        label="demo.calendar.semRecesso"
        mode="range"
        :disable="{
            between: ['2026-12-20', '2026-12-31']
        }"
    />
</template>
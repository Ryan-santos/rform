<template>
    <RText
        name="semWrapper"
        label="demo.ui.wrapperZerado"
        placeholder="demo.ui.wrapperZeradoPlaceholder"
        :ui="semWrapper"
    />
    <RText
        name="wrapperNovo"
        label="demo.ui.wrapperNovo"
        placeholder="demo.ui.wrapperNovoPlaceholder"
        :ui="{
            group: {
                wrapper: {
                    container:
                        'flex flex-row items-center rounded-none border-b-2 border-secondary'
                }
            }
        }"
    />
</template>

<script setup lang="ts">
    // `null` limpa a camada no `mergerUI`, mas o tipo de `ui` só admite
    // `string | undefined` — daí o cast, que o template não sabe fazer sozinho.
    const semWrapper = {
        group: {
            wrapper: {
                container: null as unknown as string
            }
        }
    };
</script>
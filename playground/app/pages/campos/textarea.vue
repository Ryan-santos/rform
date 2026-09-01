<template>
    <DemoPage
        title="Textarea"
        tag="RTextarea"
        description="Mesmo conjunto de utils do Text, mais rows. É também o teste vivo do v-mask: a diretiva do maska ignora textarea, a nossa não."
        :source
    >
        <Demo
            id="basico"
            title="básico"
            description="label, placeholder e description, como no Text."
        >
            <RTextarea
                name="basico"
                label="Observação"
                placeholder="escreva à vontade"
                description="Quebra de linha é permitida."
            />
        </Demo>

        <Demo
            id="rows"
            title="rows"
            description="Altura inicial em linhas."
        >
            <RTextarea
                name="curto"
                label="rows = 2"
                :rows="2"
            />
            <RTextarea
                name="longo"
                label="rows = 8"
                :rows="8"
            />
        </Demo>

        <Demo
            id="length"
            title="length"
            description="O mesmo Utils/Length do Text."
        >
            <RTextarea
                name="length"
                label="Limite de 140"
                length="140"
                placeholder="cabe um tweet antigo"
            />
        </Demo>

        <Demo
            id="mask"
            title="mask em textarea"
            description="O ponto do vMask: maska/vue faz elemento instanceof HTMLInputElement ?? querySelector('input'), e um textarea cai fora dos dois. O vMask instancia o MaskInput direto no elemento, input ou textarea."
        >
            <RTextarea
                name="dinheiroArea"
                label="dinheiro — mask do usuário, agora em textarea"
                mask="dinheiro"
                :rows="2"
            />
            <RTextarea
                name="cpfArea"
                label="brCpf em textarea"
                mask="brCpf"
                :rows="2"
            />
        </Demo>

        <Demo
            id="estados"
            title="required, loading e error"
        >
            <RTextarea
                name="obrigatorio"
                label="Obrigatório"
                required
                rule="required"
                :rows="2"
            />
            <RTextarea
                name="carregando"
                label="Carregando"
                loading
                :rows="2"
            />
            <RTextarea
                name="comErro"
                label="Erro manual"
                error="Descreva com pelo menos uma frase."
                :rows="2"
            />
        </Demo>

        <Demo
            id="rule"
            title="rule"
            description="min sobre string vira z.string().min() — a escolha do schema é pelo valor, não pelo tipo do campo."
        >
            <RTextarea
                name="ruleMin"
                label="mínimo 10 caracteres"
                :rule="{ name: 'min', min: 10 }"
                :rows="3"
            />
        </Demo>

        <DemoUi component="Textarea" />

        <DemoActions />
    </DemoPage>
</template>

<script setup lang="ts">
    import source from "./textarea.vue?raw";
</script>

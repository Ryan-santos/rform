<template>
    <DemoPage
        title="Pin"
        tag="RPin"
        description="Código de N caracteres, um por caixinha. O model é a string inteira, não um array — cola, backspace e navegação com setas funcionam como num campo só."
        :source
    >
        <Demo
            id="basico"
            title="básico"
            description="Sem length, o padrão do componente. Cole um código completo e repare que ele se distribui pelas caixas."
        >
            <RPin
                name="basico"
                label="~~Código"
            />
        </Demo>

        <Demo
            id="length"
            title="length"
        >
            <RPin
                name="curto"
                label="~~4 dígitos"
                :length="4"
            />
            <RPin
                name="longo"
                label="~~8 dígitos"
                :length="8"
            />
        </Demo>

        <Demo
            id="separator"
            title="separator"
            description="Insere um traço a cada N caixas. Só visual — o model continua sendo a string corrida."
        >
            <RPin
                name="comSeparador"
                label="~~6 dígitos, separador a cada 3"
                :separator="3"
            />
            <RPin
                name="separadorDois"
                label="~~8 dígitos, separador a cada 2"
                :length="8"
                :separator="2"
            />
        </Demo>

        <Demo
            id="type"
            title="type"
            description="numeric aceita só dígitos; alphanumeric aceita letras também e mostra em maiúsculas."
        >
            <RPin
                name="numerico"
                label="~~numeric (padrão)"
                type="numeric"
            />
            <RPin
                name="alfanumerico"
                label="~~alphanumeric"
                type="alphanumeric"
                :length="5"
            />
        </Demo>

        <Demo
            id="secret"
            title="secret"
            description="Esconde os caracteres, como um campo de senha. O valor no painel continua legível — é o model, não a tela."
        >
            <RPin
                name="secreto"
                label="~~Resgate"
                type="alphanumeric"
                :length="4"
                secret
            />
        </Demo>

        <Demo
            id="on-complete"
            title="onComplete"
            description="Dispara quando a última caixa é preenchida. Aqui só registramos a hora da última chamada."
        >
            <RPin
                name="comCallback"
                label="~~Preencha até o fim"
                :length="4"
                :on-complete="onComplete"
            />
            <p
                v-if="completedAt"
                class="text-sm text-success"
            >
                onComplete disparou às {{ completedAt }} com “{{ completedValue }}”.
            </p>
        </Demo>

        <Demo
            id="estados"
            title="required, loading e error"
        >
            <RPin
                name="obrigatorio"
                label="~~Obrigatório"
                :length="4"
                required
                rule="required"
            />
            <RPin
                name="carregando"
                label="~~Carregando"
                :length="4"
                loading
            />
            <RPin
                name="comErro"
                label="~~Erro manual"
                :length="4"
                error="Código expirado, peça outro."
            />
        </Demo>

        <DemoUi component="Pin" />

        <DemoActions />
    </DemoPage>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    import source from "./pin.vue?raw";

    const completedAt = ref("");

    const completedValue = ref("");

    const onComplete = (value: string) => {
        completedValue.value = value;
        completedAt.value = new Date().toLocaleTimeString("pt-BR");
    };
</script>
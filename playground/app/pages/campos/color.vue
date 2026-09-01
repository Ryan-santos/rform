<template>
    <DemoPage
        title="Color"
        tag="RColor"
        description="Seletor HSV em popover, com amostra e campo hexadecimal. O model é sempre a string #rrggbb."
        :source
    >
        <Demo
            id="basico"
            title="básico"
            description="O default declarado pelo componente é #000000, então o campo já nasce preenchido no model."
        >
            <RColor
                name="basico"
                placeholder="Destaque"
            />
        </Demo>

        <Demo
            id="label"
            title="label e description"
        >
            <RColor
                name="marca"
                label="Cor da marca"
                placeholder="clique para escolher"
                description="Usada nos botões e links do painel."
            />
        </Demo>

        <Demo
            id="default"
            title="default"
            description="Repare que os dois já aparecem no painel antes de você abrir o picker."
        >
            <RColor
                name="primaria"
                label="Primária"
                :default="'#005BDF'"
            />
            <RColor
                name="secundaria"
                label="Secundária"
                :default="'#00CF6C'"
            />
        </Demo>

        <Demo
            id="estados"
            title="required, loading e error"
        >
            <RColor
                name="obrigatoria"
                label="Obrigatória"
                required
                rule="required"
            />
            <RColor
                name="carregando"
                label="Carregando"
                loading
            />
            <RColor
                name="comErro"
                label="Erro manual"
                error="Contraste insuficiente para texto."
            />
        </Demo>

        <Demo
            id="rule"
            title="rule"
            description="Função inline recebendo { value } — aqui recusando qualquer tom de preto puro."
        >
            <RColor
                name="ruleFn"
                label="Não pode ser preto"
                :rule="({ value }) => (value === '#000000' ? 'Escolha uma cor.' : undefined)"
            />
        </Demo>

        <DemoUi component="Color" />

        <DemoActions />
    </DemoPage>
</template>

<script setup lang="ts">
    import source from "./color.vue?raw";
</script>

<template>
    <DemoPage
        title="File"
        tag="RFile"
        description="Dropzone com preview. O model guarda o objeto File de verdade — como um File serializa para {} em JSON, o painel ao lado o imprime por extenso em vez de mentir que o campo está vazio."
        :source
    >
        <Demo
            id="basico"
            title="básico"
            description="accept é obrigatório. Aceita a lista curta (png, jpg) e vira o filtro do input."
            ui="grid gap-4 md:grid-cols-2"
        >
            <RFile
                name="avatar"
                label="Avatar"
                placeholder="Arraste ou clique para adicionar"
                accept="png, jpg"
            />
        </Demo>

        <Demo
            id="multiple"
            title="multiple"
            description="O model vira um array de File. O tipo acompanha: Element recebe (Multiple extends true ? File[] : File) | null como terceiro parâmetro."
            ui="grid gap-4 md:grid-cols-2"
        >
            <RFile
                name="anexos"
                label="Anexos"
                placeholder="pode soltar vários de uma vez"
                accept="png, jpg, gif, mp4, pdf"
                multiple
            />
        </Demo>

        <Demo
            id="accept"
            title="accept"
            description="Os formatos aceitos viram badges dentro da própria dropzone."
            ui="grid gap-4 md:grid-cols-2"
        >
            <RFile
                name="somenteImagem"
                label="Só imagem"
                accept="png, jpg, webp"
            />
            <RFile
                name="somenteDocumento"
                label="Só documento"
                accept="pdf, doc, docx"
            />
        </Demo>

        <Demo
            id="estados"
            title="required, loading e error"
            ui="grid gap-4 md:grid-cols-2"
        >
            <RFile
                name="obrigatorio"
                label="Obrigatório"
                accept="png, jpg"
                required
                rule="required"
            />
            <RFile
                name="carregando"
                label="Enviando"
                accept="png, jpg"
                loading
            />
            <RFile
                name="comErro"
                label="Erro manual"
                accept="png, jpg"
                error="Arquivo acima de 5 MB."
            />
        </Demo>

        <Demo
            id="rule"
            title="rule"
            description="Função inline sobre o File: aqui recusando qualquer coisa acima de 1 MB."
            ui="grid gap-4 md:grid-cols-2"
        >
            <RFile
                name="ruleTamanho"
                label="Máximo 1 MB"
                accept="png, jpg, pdf"
                :rule="ateUmMega"
            />
        </Demo>

        <DemoUi component="File" />

        <DemoActions />
    </DemoPage>
</template>

<script setup lang="ts">
    import source from "./file.vue?raw";

    /**
     * Declared here, not inline no template: `File` é um global do browser e o
     * template só enxerga o escopo do componente.
     */
    const ateUmMega = ({ value }: { value: unknown }) =>
        (value instanceof File && value.size > 1024 * 1024
            ? "O arquivo precisa ter no máximo 1 MB."
            : undefined);
</script>

<template>
    <DemoPage
        title="Text"
        tag="RText"
        description="O campo base. Cobre mask (preset, crua e do usuário), rule em todas as formas que o resolveRule aceita, os utils de label/descrição/erro/contador e o override de ui."
        :source
    >
        <Demo
            id="basico"
            title="básico"
            description="label, placeholder e description. Sem name o campo não entra no model — repare que ele não aparece no JSON."
        >
            <RText
                name="basico"
                label="~~Nome"
                placeholder="~~como te chamam"
                description="~~Aparece abaixo do campo."
            />
            <RText
                label="~~Sem name"
                placeholder="~~não vai pro model"
            />
        </Demo>

        <Demo
            id="required"
            title="required"
            description="Marca visual no label. A validação de verdade é a rule required — required sozinho não valida."
        >
            <RText
                name="required"
                label="~~Com asterisco"
                required
            />
            <RText
                name="requiredRule"
                label="~~Com asterisco e validação"
                required
                rule="required"
            />
        </Demo>

        <Demo
            id="default"
            title="default"
            description="Semeado pelo useField no mount, então já sai no model antes de qualquer digitação."
        >
            <RText
                name="comDefault"
                label="~~Com default"
                default="valor inicial"
            />
        </Demo>

        <Demo
            id="length"
            title="length"
            description="Contador de caracteres (Utils/Length). Aceita number ou string."
        >
            <RText
                name="length"
                label="~~Limite de 20"
                length="20"
                placeholder="~~conte os caracteres"
            />
        </Demo>

        <Demo
            id="loading"
            title="loading e error"
            description="loading mostra o spinner; error injeta a mensagem direto, sem passar por rule."
        >
            <RText
                name="carregando"
                label="~~Carregando"
                loading
            />
            <RText
                name="comErro"
                label="~~Erro manual"
                error="Esse CPF já está cadastrado."
            />
        </Demo>

        <Demo
            id="slots"
            title="slots leading e trailing"
            description="Conteúdo livre nas duas pontas do campo, dentro do wrapper que recebe o outline de foco."
        >
            <RText
                name="whatsapp"
                label="~~WhatsApp"
                mask="brCelular"
                placeholder="~~(00) 00000-0000"
            >
                <template #leading>
                    <Icon name="logos:whatsapp-icon" />
                </template>
                <template #trailing>
                    <Icon name="twemoji:flag-brazil" />
                </template>
            </RText>
        </Demo>

        <Demo
            id="mask-preset"
            title="mask por preset"
            description="Presets embutidos: tudo que é do Brasil mora em br/ e vira brAlgumaCoisa. A mask formata o que fica no model."
        >
            <RText
                name="maskCpf"
                label="~~brCpf"
                mask="brCpf"
            />
            <RText
                name="maskCnpj"
                label="~~brCnpj"
                mask="brCnpj"
            />
            <RText
                name="maskCep"
                label="~~brCep"
                mask="brCep"
            />
            <RText
                name="maskCpfCnpj"
                label="~~brCpfCnpj — alterna pelo tamanho"
                mask="brCpfCnpj"
            />
            <RText
                name="maskPlaca"
                label="~~brPlaca"
                mask="brPlaca"
            />
        </Demo>

        <Demo
            id="mask-crua"
            title="mask crua"
            description="Nome que não bate com preset nenhum cai direto no pattern do maska."
        >
            <RText
                name="maskCrua"
                label="~~(##) #####-####"
                mask="(##) #####-####"
            />
        </Demo>

        <Demo
            id="mask-usuario"
            title="mask do usuário"
            description="app/rform/presets/masks/dinheiro.ts — um arquivo, um preset. Mesmo nome de um embutido sobrescreveria o embutido."
        >
            <RText
                name="dinheiro"
                label="~~dinheiro (reversed)"
                mask="dinheiro"
            />
        </Demo>

        <Demo
            id="rule-nome"
            title="rule pelo nome"
            description="Preset sem argumento obrigatório é referenciado só pelo nome. Valida no submit."
        >
            <RText
                name="ruleEmail"
                label="~~email"
                rule="email"
            />
            <RText
                name="ruleUrl"
                label="~~url"
                rule="url"
            />
            <RText
                name="ruleCpf"
                label="~~brCpf — com a mask junto"
                mask="brCpf"
                rule="brCpf"
            />
        </Demo>

        <Demo
            id="rule-args"
            title="rule com args nomeados"
            description="Os args vão no próprio ref, não posicionais. min escolhe o schema pelo valor, então aqui vira z.string().min()."
        >
            <RText
                name="ruleMin"
                label="~~{ name: 'min', min: 3 }"
                :rule="{ name: 'min', min: 3 }"
            />
            <RText
                name="ruleInscEst"
                label="~~brInscEst — preset do usuário, aninhado em br/"
                :rule="{ name: 'brInscEst', uf: 'SP' }"
            />
        </Demo>

        <Demo
            id="rule-array"
            title="rule em array"
            description="Roda na ordem; a primeira que falhar é a mensagem que aparece."
        >
            <RText
                name="ruleArray"
                label="~~required + min 3"
                :rule="['required', { name: 'min', min: 3 }]"
            />
        </Demo>

        <Demo
            id="rule-fn"
            title="rule como função e como zod"
            description="A função recebe um objeto só: { value, form }. O form é o model inteiro, provido pelo RForm — por isso um campo consegue olhar o outro."
        >
            <RText
                name="ruleFn"
                label="~~só aceita 1"
                :rule="({ value }) => (value === '1' ? undefined : 'Digite 1.')"
            />
            <RText
                name="ruleForm"
                label="~~tem que ser diferente do campo acima"
                :rule="
                    ({ value, form }) =>
                        value && value === form?.ruleFn
                            ? 'Não pode repetir o campo anterior.'
                            : undefined
                "
            />
            <RText
                name="ruleZod"
                label="~~z.string().min(5)"
                :rule="z.string().min(5, 'mínimo 5 caracteres')"
            />
        </Demo>

        <Demo
            id="ui"
            title="ui — override por campo"
            description="DeepPartial mesclado sobre o defaults do componente. O bloco Utils alcança os sub-componentes."
        >
            <RText
                name="uiOverride"
                label="~~Erro em rosa"
                error="Mensagem com a classe trocada."
                :ui="{
                    Utils: {
                        Error: {
                            container: 'text-pink-400'
                        }
                    }
                }"
            />
        </Demo>

        <DemoUi component="Text" />

        <DemoActions />
    </DemoPage>
</template>

<script setup lang="ts">
    import { z } from "zod";

    import source from "./text.vue?raw";
</script>
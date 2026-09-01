<template>
    <DemoPage
        title="Object"
        tag="RObject"
        description="Agrupa campos sob uma chave. Provê o próprio model para os filhos, mas não sobrescreve o form root — uma rule lá dentro continua enxergando o formulário inteiro, não só o galho."
        :source
    >
        <Demo
            id="basico"
            title="básico"
            description="Os names dos filhos viram chaves dentro de endereco no model."
        >
            <RObject
                name="endereco"
                label="Endereço"
            >
                <RText
                    name="cep"
                    label="CEP"
                    mask="brCep"
                    rule="brCep"
                />
                <RText
                    name="rua"
                    label="Rua"
                />
                <RNumber
                    name="numero"
                    label="Número"
                />
            </RObject>
        </Demo>

        <Demo
            id="required"
            title="label e required"
            description="O required aqui é do grupo, não dos filhos — marca o label do bloco."
        >
            <RObject
                name="responsavel"
                label="Responsável"
                required
            >
                <RText
                    name="nome"
                    label="Nome"
                    required
                    rule="required"
                />
                <RText
                    name="email"
                    label="E-mail"
                    rule="email"
                />
            </RObject>
        </Demo>

        <Demo
            id="aninhado"
            title="objeto dentro de objeto"
            description="Os ids empilham (empresa.matriz.cidade), e o model acompanha a mesma forma."
        >
            <RObject
                name="empresa"
                label="Empresa"
            >
                <RText
                    name="razaoSocial"
                    label="Razão social"
                />
                <RObject
                    name="matriz"
                    label="Matriz"
                >
                    <RText
                        name="cidade"
                        label="Cidade"
                    />
                    <RSelect
                        name="uf"
                        label="UF"
                        placeholder="selecione"
                        :options="ufs"
                    />
                </RObject>
            </RObject>
        </Demo>

        <Demo
            id="form-root"
            title="rule aninhada enxerga o form inteiro"
            description="O form da validação vem do defineFormRoot, provido só pelo RForm. Este campo compara com um campo que está fora do objeto."
        >
            <RText
                name="senha"
                label="Senha (fora do objeto)"
            />
            <RObject
                name="confirmacao"
                label="Confirmação"
            >
                <RText
                    name="senha"
                    label="Repita a senha"
                    :rule="({ value, form }) => (value && value !== form?.senha
                        ? 'As senhas não conferem.'
                        : undefined)"
                />
            </RObject>
        </Demo>

        <Demo
            id="default"
            title="default"
            description="O default de um objeto é clonado por instância — o useInjection faz structuredClone justamente para um filho não escrever no objeto que o componente declarou no escopo do módulo."
        >
            <RObject
                name="preferencias"
                label="Preferências"
            >
                <RSwitch
                    name="newsletter"
                    placeholder="Newsletter"
                    :default="true"
                />
                <RSelect
                    name="idioma"
                    label="Idioma"
                    :options="{ pt: 'Português', en: 'Inglês' }"
                    default="pt"
                />
            </RObject>
        </Demo>

        <DemoUi component="Object" />

        <DemoActions />
    </DemoPage>
</template>

<script setup lang="ts">
    import source from "./object.vue?raw";

    const ufs = ["SP", "RJ", "MG", "BA", "RS", "PE", "CE", "PR", "SC", "GO"];
</script>

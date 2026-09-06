<template>
    <DemoPage
        title="Array"
        tag="RArray"
        :initial="{ emails: ['contato@empresa.com', 'financeiro@empresa.com'] }"
        description="Lista de campos repetíveis. O slot entrega index, e é ele que o filho usa como name — é assim que a escrita do filho cai na posição certa do array do pai."
        :source
    >
        <Demo
            id="basico"
            title="básico"
            description="O initial do DemoPage já entrega dois e-mails, então a lista abre preenchida."
        >
            <RArray
                v-slot="{ index }"
                name="emails"
                label="~~E-mails"
            >
                <RText
                    :name="index"
                    placeholder="~~E-mail"
                    rule="email"
                />
            </RArray>
        </Demo>

        <Demo
            id="min-max"
            title="min e max"
            description="Abaixo do min o botão de remover some; no max o de adicionar some. O min também semeia as linhas iniciais."
        >
            <RArray
                v-slot="{ index }"
                name="telefones"
                label="~~De 2 a 4 telefones"
                :min="2"
                :max="4"
            >
                <RText
                    :name="index"
                    placeholder="~~Telefone"
                    mask="brTelefone"
                />
            </RArray>
        </Demo>

        <Demo
            id="button-text"
            title="text.button"
            description="Troca o texto do botão de adicionar, que por padrão é Adicionar."
        >
            <RArray
                v-slot="{ index }"
                name="tags"
                label="~~Tags"
                :text="{ button: '~~Nova tag' }"
            >
                <RText
                    :name="index"
                    placeholder="~~tag"
                />
            </RArray>
        </Demo>

        <Demo
            id="objetos"
            title="array de objetos"
            description="Um RObject dentro do slot: o index nomeia a posição e o RObject nomeia as chaves de dentro."
        >
            <RArray
                v-slot="{ index }"
                name="socios"
                label="~~Sócios"
                :min="1"
            >
                <RObject :name="index">
                    <RText
                        name="nome"
                        label="~~Nome"
                        placeholder="~~nome completo"
                    />
                    <RText
                        name="cpf"
                        label="~~CPF"
                        mask="brCpf"
                        rule="brCpf"
                    />
                    <RNumber
                        name="participacao"
                        label="~~Participação (%)"
                        :max="100"
                    />
                </RObject>
            </RArray>
        </Demo>

        <Demo
            id="aninhado"
            title="array dentro de array"
            description="Cada nível empilha seu index no id do campo, então os models não se atropelam."
        >
            <RArray
                v-slot="{ index: setor }"
                name="setores"
                label="~~Setores"
                button-text="~~Novo setor"
            >
                <RArray
                    v-slot="{ index }"
                    :name="setor"
                    button-text="~~Novo integrante"
                >
                    <RText
                        :name="index"
                        placeholder="~~integrante"
                    />
                </RArray>
            </RArray>
        </Demo>

        <Demo
            id="rule"
            title="rule no array"
            description="min e max sobre um array viram z.array().min() / .max() — de novo, o schema sai do valor, não do tipo do campo."
        >
            <RArray
                v-slot="{ index }"
                name="convidados"
                label="~~Pelo menos 2 convidados"
                :rule="{ name: 'min', min: 2 }"
            >
                <RText
                    :name="index"
                    placeholder="~~nome do convidado"
                />
            </RArray>
        </Demo>

        <DemoUi component="Array" />

        <DemoActions />
    </DemoPage>
</template>

<script setup lang="ts">
    import source from "./array.vue?raw";
</script>
<template>
    <DemoPage
        title="Tradução"
        tag="tr"
        description="Nenhum texto do módulo é cravado, e todo texto que você passa numa prop pode ser uma chave do seu app. Este playground tem @nuxtjs/i18n, então o rform usa a ponte: as mensagens dele moram no store do vue-i18n sob rform. Troque o idioma no rodapé da barra lateral — tudo nesta página que for chave muda, e o que for literal não."
        :source
    >
        <Demo
            id="chave-vs-literal"
            title="Chave do app, ou literal com ~~"
            description="Com i18n instalado, TrInput é gerado do seu próprio arquivo de mensagens: label='form.nome' compila, label='Nome' é erro. Um texto que não é para traduzir se marca com ~~, e tr remove o marcador na renderização. Troque o idioma: o primeiro campo muda, o segundo não."
        >
            <RText
                name="titular"
                label="traducao.titular"
            />
            <RText
                name="apelido"
                label="~~Apelido (literal, não traduz)"
            />
        </Demo>

        <Demo
            id="parametros"
            title="Chave com parâmetros"
            description="Quando a mensagem interpola, a prop recebe a forma de objeto. O tipo dos params vem do próprio texto da mensagem: 'No máximo {n} caracteres' gera { n: Interp }, e passar o params errado é erro de compilação."
        >
            <RText
                name="bio"
                label="traducao.titular"
                :description="{ key: 'traducao.ajudaMax', params: { n: 30 } }"
            />
        </Demo>

        <Demo
            id="mensagens-do-modulo"
            title="As mensagens do próprio módulo"
            description="O botão do RArray e o texto do RSelect saem do pack do módulo, registrado sob rform pelo i18n:registerModule. Nada aqui declara esses textos — eles trocam de idioma junto com o resto."
        >
            <RArray
                name="socios"
                label="traducao.socios"
            >
                <template #default="{ index }">
                    <RText :name="index" />
                </template>
            </RArray>

            <RSelect
                name="uf"
                label="form.uf"
                :options="['SP', 'RJ', 'MG']"
                search
            />
        </Demo>

        <Demo
            id="text-prop"
            title="Trocar uma mensagem do módulo numa instância"
            description="Cada campo com texto próprio expõe a prop text, espelhando o defaults.text dele. É um objeto aninhado — nunca uma prop achatada tipo buttonText — e o que você passa entra cru, sem prefixo: uma chave do seu app ou um ~~ literal."
        >
            <RArray
                name="contatos"
                label="~~Contatos"
                :text="{ button: '~~Adicionar contato' }"
            >
                <template #default="{ index }">
                    <RText :name="index" />
                </template>
            </RArray>
        </Demo>

        <Demo
            id="rules"
            title="Mensagem de rule, e plural de verdade"
            description="Uma rule não é componente e não chama composable — ela importa trRule, que prefixa rform.presets.rules. As mensagens de min e max são plurais: o número que a mensagem interpola é o mesmo que escolhe a forma, então min 1 diz 'caractere' e min 5 diz 'caracteres'. Rode o submit."
        >
            <RText
                name="curto"
                label="~~Mínimo de 1"
                :rule="{ name: 'min', min: 1 }"
            />
            <RText
                name="longo"
                label="~~Mínimo de 5"
                :rule="{ name: 'min', min: 5 }"
            />
            <RText
                name="obrigatorio"
                label="~~Obrigatório"
                rule="required"
            />
            <DemoActions />
        </Demo>

        <Demo
            id="sobrescrever"
            title="Sobrescrever uma mensagem do módulo no app"
            description="Com @nuxtjs/i18n é a precedência normal do vue-i18n: declare a chave sob rform no locale do seu app e pronto. Sem @nuxtjs/i18n, o mesmo se faz em app/rform/locales/<code>.ts, que mescla por cima do pack embutido em vez de substituí-lo."
        >
            <DemoCode
                :code="override"
                lang="json"
                label="i18n/locales/pt-BR.json"
            />
            <DemoCode
                :code="userPack"
                lang="ts"
                label="app/rform/locales/pt-BR.ts (sem @nuxtjs/i18n)"
            />
        </Demo>

        <Demo
            id="arroba"
            title="Um @ literal precisa de escape"
            description="@:chave é a sintaxe de mensagem ligada do vue-i18n, então um e-mail cru numa mensagem derruba o parser com 'Invalid linked format (error code: 10)', nomeando o caminho da mensagem. Escreva {'@'} — é o que a chave form.emailExemplo deste playground faz."
        >
            <RText
                name="email"
                label="form.email"
                placeholder="form.emailExemplo"
            />
            <DemoCode
                :code="arroba"
                lang="json"
                label="i18n/locales/pt-BR.json"
            />
        </Demo>
    </DemoPage>
</template>

<script setup lang="ts">
    import source from "./traducao.vue?raw";

    const override = `{
    "rform": {
        "fields": { "array": { "add": "Incluir" } },
        "presets": { "rules": { "required": "Preencha este campo." } }
    }
}`;

    const userPack = `import { defineLocale } from "#rform/utils";

export default defineLocale({
    fields: {
        array: { add: "Incluir" }
    }
});`;

    const arroba = `{
    "form": {
        "emailExemplo": "voce{'@'}empresa.com"
    }
}`;
</script>
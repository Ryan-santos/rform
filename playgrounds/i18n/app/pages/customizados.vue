<template>
    <DemoPage
        title="Campos e utils próprios"
        tag="app/rform"
        description="Um arquivo .vue em app/rform/fields vira um campo de primeira classe: ganha tag com prefixo R, entra no FieldType (então o useRForm aceita type), no Components (então o defineFieldDefaults tipa) e pode ser alvo do available de um preset. app/rform/utils faz o mesmo para os pedaços internos do campo. Mesmo nome de um embutido substitui o embutido."
        :source
    >
        <Demo
            id="campo-novo"
            title="Um campo que o módulo não tem"
            description="app/rform/fields/Rating.vue segue exatamente o formato do Text.vue: exporta defaults via defineDefaults e um Props montado a partir de Element<typeof defaults, 'rating'>. Daí em diante ele é um campo como qualquer outro — name, rule, label, ui e model funcionam sem nada a mais."
        >
            <RRating
                name="nota"
                label="~~Como foi o atendimento?"
                rule="required"
            />
            <RRating
                name="notaCurta"
                label="~~Escala menor"
                :max="3"
                hint="max troca a quantidade de estrelas."
            />
        </Demo>

        <Demo
            id="util-novo"
            title="Um util que o módulo não tem"
            description="app/rform/utils/Hint.vue vira RUtilsHint e enxerga as props do campo pai pelo useUtil, igual ao RUtilsError e ao RUtilsLabel. O Rating acima o renderiza, então a prop hint passa a existir em qualquer campo que o inclua."
        >
            <RRating
                name="comHint"
                label="~~Com dica"
                hint="O hint sai do RUtilsHint, que é um arquivo do app — não do módulo."
            />
        </Demo>

        <Demo
            id="no-schema"
            title="No schema do useRForm"
            description="Como o campo entra no FieldType, ele é um type válido no schema — e o RDynamic o monta sozinho, sem nenhuma tag escrita à mão."
        >
            <RDynamic :schema />
        </Demo>

        <Demo
            id="defaults"
            title="No defineFieldDefaults"
            description="app/rform/defaults.ts é tipado a partir do mesmo Components, então o campo novo aparece nele com autocomplete — a chave Rating abaixo é do arquivo do app, não do módulo."
        >
            <DemoCode :code="defaultsExample" />
        </Demo>
    </DemoPage>
</template>

<script setup lang="ts">
    import type { Schema } from "#rform/types/schema";

    import source from "./customizados.vue?raw";

    const schema: Schema = {
        apelido: { type: "text", label: "~~Apelido" },
        nota: { type: "rating", label: "~~Nota", max: 5, rule: "required" }
    };

    const defaultsExample = `import { defineFieldDefaults } from "#rform/utils";

export default defineFieldDefaults({
    Rating: {
        max: 10,
        ui: { star: { on: "text-primary" } }
    },
    Utils: {
        Hint: { ui: { container: "text-[10px]" } }
    }
});`;
</script>
<template>
    <DemoPage
        title="Number"
        tag="RNumber"
        description="Campo numérico com controles de incremento. O model é number | null — o Element recebe esse D como terceiro parâmetro, sobrescrevendo o tipo que sairia do default."
        :source
    >
        <Demo
            id="basico"
            title="básico"
            description="O default declarado pelo componente é 0, então o campo já nasce no model."
        >
            <RNumber
                name="basico"
                placeholder="~~quantidade"
            />
        </Demo>

        <Demo
            id="min-max-step"
            title="min, max e step"
            description="Os controles andam de step em step e param nos limites."
        >
            <RNumber
                name="intervalo"
                label="~~20 a 100, de 20 em 20"
                :min="20"
                :max="100"
                :step="20"
            />
            <RNumber
                name="decimal"
                label="~~step 0.5"
                :step="0.5"
            />
        </Demo>

        <Demo
            id="slots"
            title="slots leading e trailing"
            description="Bom lugar para unidade."
        >
            <RNumber
                name="delay"
                placeholder="~~delay"
            >
                <template #trailing> segundos </template>
            </RNumber>
            <RNumber
                name="preco"
                placeholder="~~preço"
            >
                <template #leading> R$ </template>
            </RNumber>
        </Demo>

        <Demo
            id="default"
            title="default"
        >
            <RNumber
                name="comDefault"
                label="~~Começa em 42"
                :default="42"
            />
        </Demo>

        <Demo
            id="rule"
            title="rule"
            description="min e max escolhem o schema pelo valor: com number no model viram z.number().min() / .max()."
        >
            <RNumber
                name="ruleMin"
                label="~~mínimo 18"
                :rule="{ name: 'min', min: 18 }"
            />
            <RNumber
                name="ruleMax"
                label="~~máximo 30"
                :rule="{ name: 'max', max: 30 }"
            />
            <RNumber
                name="ruleFaixa"
                label="~~entre 18 e 30"
                :rule="[
                    { name: 'min', min: 18 },
                    { name: 'max', max: 30 }
                ]"
            />
        </Demo>

        <Demo
            id="estados"
            title="loading e error"
        >
            <RNumber
                name="carregando"
                label="~~Carregando"
                loading
            />
            <RNumber
                name="comErro"
                label="~~Erro manual"
                error="Fora do estoque disponível."
            />
        </Demo>

        <Demo
            id="ui"
            title="ui — override por campo"
            description="O trailing herda opacidade menor sem tocar no resto do defaults."
        >
            <RNumber
                name="uiOverride"
                label="~~minutos"
                :ui="{
                    group: {
                        wrapper: {
                            trailing: 'opacity-50'
                        }
                    }
                }"
            >
                <template #trailing> minutos </template>
            </RNumber>
        </Demo>

        <DemoUi component="Number" />

        <DemoActions />
    </DemoPage>
</template>

<script setup lang="ts">
    import source from "./number.vue?raw";
</script>
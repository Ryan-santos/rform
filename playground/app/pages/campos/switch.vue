<template>
    <DemoPage
        title="Switch"
        tag="RSwitch"
        description="Booleano. Diferente dos outros campos, o placeholder aqui vira o texto ao lado do botão, não um rótulo flutuante."
        :source
    >
        <Demo
            id="label-placeholder"
            title="label e placeholder"
            description="label fica acima, como nos outros campos. placeholder fica na mesma linha do botão — dá pra usar os dois juntos."
        >
            <RSwitch
                name="comLabel"
                label="~~Notificações"
            />
            <RSwitch
                name="comPlaceholder"
                placeholder="~~Receber e-mails de novidades"
            />
            <RSwitch
                name="comOsDois"
                label="~~Privacidade"
                placeholder="~~Perfil público"
            />
        </Demo>

        <Demo
            id="icon"
            title="icon"
            description="true usa os ícones padrão (check quando ligado, loading enquanto carrega). O objeto troca cada estado por um ícone seu."
        >
            <RSwitch
                name="iconPadrao"
                placeholder="~~icon (padrão)"
                icon
            />
            <RSwitch
                name="iconCustom"
                placeholder="~~icon com config própria"
                :icon="{
                    true: 'twemoji:check-mark-button',
                    false: 'twemoji:cross-mark'
                }"
            />
            <RSwitch
                name="semIcon"
                placeholder="~~sem icon"
            />
        </Demo>

        <Demo
            id="default"
            title="default"
            description="Já sai true no model antes de qualquer clique."
        >
            <RSwitch
                name="comDefault"
                placeholder="~~Começa ligado"
                :default="true"
            />
        </Demo>

        <Demo
            id="estados"
            title="required, description e error"
        >
            <RSwitch
                name="aceite"
                label="~~Termos de uso"
                placeholder="~~Li e aceito"
                description="~~Sem isso a conta não é criada."
                required
                :rule="({ value }) => (value === true ? undefined : 'É preciso aceitar os termos.')"
            />
            <RSwitch
                name="comErro"
                placeholder="~~Erro manual"
                error="Essa opção está bloqueada pelo plano atual."
            />
        </Demo>

        <DemoUi component="Switch" />

        <DemoActions />
    </DemoPage>
</template>

<script setup lang="ts">
    import source from "./switch.vue?raw";
</script>
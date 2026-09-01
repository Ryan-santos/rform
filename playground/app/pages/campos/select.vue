<template>
    <DemoPage
        title="Select"
        tag="RSelect"
        description="Dropdown com options em três formatos, seleção múltipla e slot de item. Compare no painel: sem modelFull o model guarda só o valor; com modelFull guarda o objeto inteiro."
        :source
    >
        <Demo
            id="primitivo"
            title="options — array primitivo"
            description="O valor e o label são o próprio item."
        >
            <RSelect
                name="primitivo"
                placeholder="selecione"
                :options="[1, 2, 3]"
            />
            <RSelect
                name="primitivoTexto"
                label="Strings"
                placeholder="selecione"
                :options="['pequeno', 'médio', 'grande']"
            />
        </Demo>

        <Demo
            id="objeto"
            title="options — objeto { chave: label }"
            description="A chave vira o valor; o valor do objeto vira o label. O que vai pro model é a chave."
        >
            <RSelect
                v-slot="{ selected }"
                name="cor"
                placeholder="Cor"
                :options="{
                    blue: 'azul',
                    red: 'vermelho',
                    green: 'verde'
                }"
            >
                <span
                    class="block size-3 rounded-full"
                    :style="`background-color: ${selected.value}`"
                />
                <p>{{ selected.label }}</p>
            </RSelect>
        </Demo>

        <Demo
            id="key-value-label"
            title="keyValue e keyLabel"
            description="Array de objetos: keyValue diz qual campo vira o valor, keyLabel qual vira o texto. Os dois têm default no defaults do componente."
        >
            <RSelect
                name="usuario"
                label="Funcionário"
                placeholder="selecione"
                :options="users"
                key-value="id"
                key-label="name"
            />
        </Demo>

        <Demo
            id="model-full"
            title="modelFull"
            description="Sem ele o model recebe só o valor resolvido por keyValue. Com ele, o objeto original inteiro."
        >
            <RSelect
                name="usuarioValor"
                label="Sem modelFull"
                placeholder="só o id vai pro model"
                :options="users"
                key-value="id"
                key-label="name"
            />
            <RSelect
                v-slot="{ selected }"
                name="usuarioFull"
                label="Com modelFull"
                placeholder="o objeto inteiro vai pro model"
                :options="users"
                key-value="id"
                key-label="name"
                model-full
            >
                <img
                    :src="selected.original.picture"
                    class="block size-5 rounded-full bg-primary"
                />
                <p>{{ selected.label }}</p>
            </RSelect>
        </Demo>

        <Demo
            id="multiple"
            title="multiple"
            description="O model vira array. multiple é declarado como Multiple & boolean — a interseção é o que força o compilador SFC a emitir type: Boolean, senão o atributo sem valor chegaria como string vazia."
        >
            <RSelect
                name="multiplo"
                label="Vários ids"
                placeholder="Funcionários"
                :options="users"
                key-value="id"
                key-label="name"
                multiple
            />
            <RSelect
                v-slot="{ selected, list }"
                name="multiploFull"
                label="Vários objetos, com slot"
                placeholder="Funcionários"
                :options="users"
                key-value="id"
                key-label="name"
                multiple
                model-full
            >
                <template
                    v-for="item in selected"
                    :key="String(item.value)"
                >
                    <img
                        :src="item.original?.picture"
                        class="block size-5 rounded-full bg-primary"
                    />
                    <p v-if="list">
                        {{ item.label }}
                    </p>
                </template>
            </RSelect>
        </Demo>

        <Demo
            id="slot"
            title="slot — campo e linha da lista"
            description="O mesmo slot desenha os dois lugares; list diz onde você está. Aqui a linha da lista mostra o cargo e o campo não."
        >
            <RSelect
                v-slot="{ selected, list }"
                name="comSlot"
                label="Funcionário"
                placeholder="selecione"
                :options="users"
                key-value="id"
                key-label="name"
                model-full
            >
                <img
                    :src="selected.original.picture"
                    class="block size-5 rounded-full bg-primary"
                />
                <p>{{ selected.label }}</p>
                <p
                    v-if="list"
                    class="ml-auto text-xs text-contrast/40"
                >
                    {{ selected.original.role }}
                </p>
            </RSelect>
        </Demo>

        <Demo
            id="default"
            title="default"
            description="Com modelFull o default é o objeto; sem ele, o valor."
        >
            <RSelect
                v-slot="{ selected }"
                name="comDefault"
                label="Já vem escolhido"
                :options="users"
                :default="users[1]"
                key-value="id"
                key-label="name"
                model-full
            >
                <img
                    :src="selected.original.picture"
                    class="block size-5 rounded-full bg-primary"
                />
                <p>{{ selected.label }}</p>
            </RSelect>
        </Demo>

        <Demo
            id="estados"
            title="required, loading e error"
        >
            <RSelect
                name="obrigatorio"
                label="Obrigatório"
                placeholder="selecione"
                :options="['a', 'b']"
                required
                rule="required"
            />
            <RSelect
                name="carregando"
                label="Carregando"
                placeholder="selecione"
                :options="['a', 'b']"
                loading
            />
            <RSelect
                name="comErro"
                label="Erro manual"
                placeholder="selecione"
                :options="['a', 'b']"
                error="Essa opção saiu do catálogo."
            />
        </Demo>

        <DemoUi component="Select" />

        <DemoActions />
    </DemoPage>
</template>

<script setup lang="ts">
    import source from "./select.vue?raw";

    const users = [
        { id: 1, name: "João Silva", role: "Suporte", picture: "https://randomuser.me/api/portraits/men/1.jpg" },
        { id: 2, name: "Maria Souza", role: "Financeiro", picture: "https://randomuser.me/api/portraits/women/2.jpg" },
        { id: 3, name: "Pedro Santos", role: "Comercial", picture: "https://randomuser.me/api/portraits/men/3.jpg" },
        { id: 4, name: "Ana Oliveira", role: "Diretoria", picture: "https://randomuser.me/api/portraits/women/4.jpg" },
        { id: 5, name: "Carlos Ferreira", role: "Logística", picture: "https://randomuser.me/api/portraits/men/5.jpg" }
    ];
</script>

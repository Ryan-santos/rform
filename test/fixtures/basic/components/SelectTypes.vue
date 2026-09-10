<template>
    <div>
        <!-- array de objetos: `value` é `item[keyValue]`, `original` é o item -->
        <RSelect
            v-slot="{ selected }"
            name="porValor"
            :options="users"
            key-value="id"
            key-label="name"
            :default="1"
            @update:model-value="takesNumber"
        >
            {{ takesNumber(selected.value) }}
            {{ takesString(selected.label) }}
            {{ takesUser(selected.original) }}
        </RSelect>

        <!-- `modelFull`: o item inteiro é o que vai ao model -->
        <RSelect
            name="porItem"
            :options="users"
            key-value="id"
            model-full
            :default="users[0]"
            @update:model-value="takesUser"
        />

        <!-- `multiple` embrulha em lista, dos dois lados -->
        <RSelect
            name="varios"
            :options="users"
            key-value="id"
            multiple
            :default="[1, 2]"
            @update:model-value="takesNumbers"
        />

        <!-- array de primitivos: o item é o próprio valor -->
        <RSelect
            v-slot="{ selected }"
            name="primitivo"
            :options="['pequeno', 'grande']"
            @update:model-value="takesString"
        >
            {{ takesString(selected.value) }}
        </RSelect>

        <!-- objeto: o valor é a chave, o label é o valor -->
        <RSelect
            v-slot="{ selected }"
            name="objeto"
            :options="{ blue: 'azul', red: 'vermelho' }"
            @update:model-value="takesColor"
        >
            {{ takesColor(selected.value) }}
            {{ takesString(selected.label) }}
        </RSelect>

        <!-- caminho pontilhado não é `keyof`: o valor volta a ser `unknown` -->
        <RSelect
            v-slot="{ selected }"
            name="aninhado"
            :options="nested"
            key-value="owner.id"
            key-label="name"
            @update:model-value="takesUnknown"
        >
            {{ takesUnknown(selected.value) }}
        </RSelect>

        <!-- o valor não é mais `unknown`: uma chave de outro tipo não passa -->
        <!-- @vue-expect-error -->
        <RSelect
            name="tipoErrado"
            :options="users"
            key-value="id"
            @update:model-value="takesString"
        />

        <!-- @vue-expect-error -->
        <RSelect
            name="defaultErrado"
            :options="users"
            key-value="id"
            :default="'um'"
        />

        <!-- sem `multiple` o model não é lista -->
        <!-- @vue-expect-error -->
        <RSelect
            name="listaSemMultiple"
            :options="users"
            key-value="id"
            :default="[1]"
        />
    </div>
</template>

<script setup lang="ts">
    /**
     * Guarda de tipo do `RSelect`, escrita do lugar de quem consome: é o `vue-tsc`
     * da fixture que a executa. Ver a issue #4 — o generic de `options` tem de
     * chegar ao model, ao `default` e ao slot.
     */
    type User = { id: number; name: string; role: string };

    const users: User[] = [{ id: 1, name: "Ana", role: "Suporte" }];

    const nested = [{ name: "Ana", owner: { id: 1 } }];

    const takesNumber = (value: number) => value;
    const takesNumbers = (value: number[]) => value.length;
    const takesString = (value: string) => value;
    const takesUser = (value: User) => value.name;
    const takesColor = (value: "blue" | "red") => value;
    const takesUnknown = (value: unknown) => String(value);
</script>
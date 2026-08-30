<template>
    <section class="flex min-h-screen flex-row justify-center gap-6 py-12">
        <RForm
            v-slot="{ model }"
            v-model="form"
            class="grid auto-rows-min grid-cols-4 gap-6"
        >
            <RText
                name="cpf"
                label="cpf — mask e rule pelo nome do preset"
                mask="brCpf"
                rule="brCpf"
            />
            <RText
                name="composto"
                label="composto — array de presets, um com args nomeados"
                :rule="['required', { name: 'min', min: 3 }]"
            />
            <RText
                name="inscEst"
                label="inscEst — preset do usuário, aninhado em br/"
                :rule="{ name: 'brInscEst', uf: 'SP' }"
            />
            <RText
                name="dinheiro"
                label="dinheiro — mask do usuário (app/rform/presets/masks)"
                mask="dinheiro"
            />
            <RTextarea
                name="dinheiroArea"
                label="dinheiroArea — mesma mask, agora em textarea"
                mask="dinheiro"
            />
            <RText
                name="text"
                type="text"
                label="texto simples"
                placeholder="placeholder"
                description="Descrição"
                required
                :ui="{
                    Utils: {
                        Error: {
                            container: 'text-pink-400'
                        }
                    }
                }"
                :rule="({ value }) => (value !== '1' ? 'oxe' : undefined)"
            />
            <RText
                name="whatsapp"
                placeholder="whatsapp"
                description="Seu numero de whatsapp"
                mask="(##) #####-####"
                required
                loading
            >
                <template #leading>
                    <Icon name="logos:whatsapp-icon" />
                </template>
                <template #trailing>
                    <Icon name="twemoji:flag-brazil" />
                </template>
            </RText>
            <RText
                name="length"
                type="text"
                length="20"
                placeholder="com limitador de tamanho"
            />
            <RNumber
                name="delay"
                placeholder="delay"
            >
                <template #trailing> segundos </template>
            </RNumber>
            <RNumber
                name="minutes"
                label="intervalo"
                placeholder="delay"
                :min="20"
                :max="100"
                :step="20"
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
            <RText
                name="default"
                type="text"
                length="20"
                default="teste"
            />
            <RText
                name="default"
                type="text"
                loading
            />
            <RNumber
                name="number"
                placeholder="numero"
            />
            <RText
                name="email"
                placeholder="E-mail"
            />
            <RSwitch
                name="view"
                label="toggle"
            />
            <RSwitch
                name="active"
                placeholder="toggle"
            />
            <RColor
                name="color"
                placeholder="Destaque"
            />
            <RColor
                name="contrast"
                placeholder="Contraste"
            />
            <RDate
                name="data"
                placeholder="Aniversário"
                default="2003-11-24"
            />
            <RDate
                name="data_renge"
                placeholder="data de execução"
                mode="range"
            />
            <RDate
                name="data_multiple"
                placeholder="datas avulsas"
                mode="multiple"
            />
            <RDate
                name="data_hora"
                placeholder="agendamento"
                time
            />
            <RDate
                name="data_hora_range"
                placeholder="janela de execução"
                mode="range"
                time
            />
            <RDate
                name="data_restrita"
                placeholder="agendamento (sem fds e feriados)"
                :disable="{
                    before: '2026-01-01',
                    after: '2026-12-31',
                    dates: ['2026-04-21', '2026-05-01', '2026-09-07']
                }"
            />
            <RDate
                name="data_range_bloqueado"
                placeholder="evitar recesso"
                mode="range"
                :disable="{
                    between: ['2026-12-20', '2026-12-31']
                }"
            />
            <RHour
                name="hora"
                placeholder="horário"
            />
            <RHour
                name="hora_range"
                placeholder="janela de atendimento"
                range
            />
            <RCalendar
                name="agenda"
                label="Agenda"
                class="col-span-2"
            />
            <RCalendar
                name="agenda_range"
                label="Período de férias"
                mode="range"
                time
                class="col-span-2"
            />
            <RCalendar
                name="agenda_multiple"
                label="Feriados"
                mode="multiple"
                class="col-span-2"
            />
            <RFile
                name="avatar_file"
                label="Avatar"
                placeholder="Adicionar avatar avatar"
                accept="png, jpg, gif, mp4"
            />
            <RFile
                name="file_list"
                multiple
                accept="png, jpg, gif, mp4"
            />
            <RTextarea
                name="texto"
                placeholder="Texto"
            />
            <RPin
                name="codigo"
                label="código — 6 dígitos, separador a cada 3"
                :separator="3"
                autofocus
                rule="required"
                class="col-span-2"
            />
            <RPin
                name="resgate"
                label="resgate — alfanumérico, secreto"
                type="alphanumeric"
                :length="4"
                secret
                class="col-span-2"
            />

            <RArray
                v-slot="{ index }"
                name="array"
                :min="2"
                :max="4"
            >
                <RText
                    :name="index"
                    placeholder="E-mail"
                />
            </RArray>

            <RArray
                v-slot="{ index }"
                name="configs"
                label="configs"
            >
                <RObject :name="index">
                    <RText
                        name="default"
                        type="text"
                        placeholder="teste"
                        loading
                    />
                    <RText
                        name="ref"
                        type="text"
                        placeholder="teste"
                        loading
                    />
                </RObject>
            </RArray>

            <RObject
                name="payload"
                label="Payload"
                required
            >
                <RText
                    name="default"
                    type="text"
                    placeholder="teste"
                    default="toma mil"
                    loading
                />
                <RText
                    name="ref"
                    type="text"
                    placeholder="teste"
                    loading
                />
            </RObject>

            <RSelect
                name="select"
                placeholder="selecione"
                :options="[1, 2, 3]"
            />

            <RSelect
                v-slot="{ selected, list }"
                name="users"
                placeholder="Funcionários"
                :options="users"
                modelFull
                multiple
            >
                <template
                    v-for="item in selected"
                    :key="item.value"
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

            <RSelect
                v-slot="{ selected }"
                name="user"
                placeholder="Funcionário"
                :options="users"
                :default="users[1]"
                modelFull
            >
                <img
                    :src="selected.original.picture"
                    class="block size-5 rounded-full bg-primary"
                />
                <p>
                    {{ selected.label }}
                </p>
            </RSelect>

            <RSelect
                v-slot="{ selected, list }"
                name="helper"
                placeholder="Ajudante"
                :options="users"
                modelFull
            >
                <img
                    v-if="!list && model.user?.picture"
                    :src="model.user?.picture"
                    class="-mr-2 block size-5 rounded-full bg-primary"
                />
                <img
                    :src="selected.original.picture"
                    class="block size-5 rounded-full bg-primary"
                />
                <p>
                    {{ selected.label }}
                </p>
            </RSelect>

            <RSelect
                v-slot="{ selected }"
                name="select2"
                placeholder="selecione"
                :options="{
                    blue: 'azul',
                    red: 'vermelho'
                }"
            >
                <span
                    class="block size-2 rounded-full bg-primary"
                    :style="`background-color: ${selected.value}`"
                />
                <p>
                    {{ selected.label }}
                </p>
            </RSelect>

            <div class="col-span-full flex flex-row">
                <pre data-allow-mismatch>
                    slot model
                    {{ model }}
                </pre>
                <pre data-allow-mismatch>
                    V-MODEL
                    {{ form }}
                </pre>
            </div>

            <button type="reset">reset</button>
            <button type="submit">submit</button>
        </RForm>
    </section>
</template>

<script setup lang="ts">
    const users = [
        {
            id: 1,
            name: "João Silva",
            picture: "https://randomuser.me/api/portraits/men/1.jpg"
        },
        {
            id: 2,
            name: "Maria Souza",
            picture: "https://randomuser.me/api/portraits/women/2.jpg"
        },
        {
            id: 3,
            name: "Pedro Santos",
            picture: "https://randomuser.me/api/portraits/men/3.jpg"
        },
        {
            id: 4,
            name: "Ana Oliveira",
            picture: "https://randomuser.me/api/portraits/women/4.jpg"
        },
        {
            id: 5,
            name: "Carlos Ferreira",
            picture: "https://randomuser.me/api/portraits/men/5.jpg"
        },
        {
            id: 6,
            name: "Maria Souza",
            picture: "https://randomuser.me/api/portraits/women/6.jpg"
        },
        {
            id: 7,
            name: "Pedro Santos",
            picture: "https://randomuser.me/api/portraits/men/7.jpg"
        },
        {
            id: 8,
            name: "Ana Oliveira",
            picture: "https://randomuser.me/api/portraits/women/8.jpg"
        },
        {
            id: 9,
            name: "Carlos Ferreira",
            picture: "https://randomuser.me/api/portraits/men/9.jpg"
        },
        {
            id: 10,
            name: "Maria Souza",
            picture: "https://randomuser.me/api/portraits/women/10.jpg"
        },
        {
            id: 11,
            name: "Pedro Santos",
            picture: "https://randomuser.me/api/portraits/men/11.jpg"
        },
        {
            id: 12,
            name: "Ana Oliveira",
            picture: "https://randomuser.me/api/portraits/women/12.jpg"
        },
        {
            id: 13,
            name: "Carlos Ferreira",
            picture: "https://randomuser.me/api/portraits/men/13.jpg"
        }
    ];

    const form = ref({
        array: ["11", "22"],
        user: users[2]
    });

    // // formar o formulário de forma dinâmica
    // // rules tem que ser regra do zod/v4
    // // fn que retorna { rules, schema, data } para alimentar o <RForm>
    // const { rules, schema, data } = useRForm({
    //     name: {
    //         type: "text",
    //         label: "nome",
    //         rule: z.string()
    //     },
    //     years: {
    //         type: "number",
    //         label: "Idade",
    //         min: 18,
    //         max: 30,
    //         rule: z.number().min(18).max(30)
    //     },
    //     payload: {
    //         type: "object",
    //         label: "payload",
    //         children: {
    //             var: {
    //                 type: "text",
    //                 label: "nome",
    //                 rule: z.string()
    //             }
    //         }
    //     }
    // });

    // // tipar com regras
    // const { rules, data } = useRForm({
    //     name: z.string(),
    //     years: z.number().min(18).max(30),
    //     payload: z.object({
    //         var: z.string()
    //     })
    // });

    // // tipar com ts
    // const { data } = useRForm<{
    //     name: string;
    //     years: number;
    //     payload: {
    //         var: string;
    //     };
    // }>();

    // // poder usar slots para personalizar
    // // esse slot vai receber { name, rule } e tem que usar uma component de rform la, ou com suporte a api da rform
    // const { rules, schema, data } = useRForm({
    //     name: {
    //         type: "text",
    //         label: "nome",
    //         rule: z.string()
    //     },
    //     years: {
    //         type: "number",
    //         label: "Idade",
    //         min: 18,
    //         max: 30,
    //         rule: z.number().min(18).max(30)
    //     },
    //     payload: {
    //         type: "object",
    //         label: "payload",
    //         children: {
    //             var: {
    //                 type: "text",
    //                 label: "nome",
    //                 rule: z.string()
    //             }
    //         }
    //     },
    //     users: {
    //         slot: "users",
    //         rule: z.array()
    //     }
    // });
</script>
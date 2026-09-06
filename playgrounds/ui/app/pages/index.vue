<template>
    <div class="flex flex-col gap-4">
        <Card
            title="O que este playground prova"
            description="Aparência, nos três lugares onde ela se decide. Sem @nuxtjs/i18n de propósito: aqui toda label seria uma chave, e chave é ruído quando o assunto é classe."
        >
            <ul class="flex list-disc flex-col gap-2 pl-6 text-sm text-contrast/70">
                <li>
                    <b>/tokens</b> — as 16 variáveis <code class="font-mono">--rf-*</code>, trocadas
                    ao vivo.
                </li>
                <li>
                    <b>/defaults</b> — <code class="font-mono">app/rform/defaults.ts</code>, pesado.
                </li>
                <li>
                    <b>/campo</b> — a prop <code class="font-mono">ui</code>, que ganha dos dois.
                </li>
            </ul>
        </Card>
    </div>
</template>
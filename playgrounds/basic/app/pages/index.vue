<template>
    <div class="flex flex-col gap-4">
        <Card
            title="O que este playground prova"
            description="Um app comum com @nuxtjs/i18n, em condições de app real — não uma vitrine de props."
        >
            <ul class="flex list-disc flex-col gap-2 pl-6 text-sm text-contrast/70">
                <li>
                    <b>/checkout</b> — cadastro de ponta a ponta: aninhado, máscaras br, validação
                    no submit, loading e erro do servidor.
                </li>
                <li>
                    <b>/dinamico</b> — um RDynamic montado de um JSON servido por rota do Nitro. O
                    schema chega pela rede, não do bundle.
                </li>
                <li>
                    <b>/editar</b> — CRUD: a tela abre preenchida, e dá para ver a diferença entre
                    <code class="font-mono">default</code> e
                    <code class="font-mono">modelValue</code>, o reset e o dirty.
                </li>
            </ul>
        </Card>
    </div>
</template>
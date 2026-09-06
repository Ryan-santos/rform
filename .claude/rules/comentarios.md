# Comentários e JSDoc

- **pt-BR** no que descreve o código: comentário, JSDoc e descrição de teste
  (`describe`/`it`). Código continua em inglês — nome de variável, função, tipo,
  componente, chave de `ui`, rota, mensagem de `throw`/`console.warn`.
- **Curtos e diretos.** 1–3 linhas. O porquê em uma frase, não num parágrafo.
  Racional longo mora no `.claude/CLAUDE.md`, e o comentário aponta pra lá.
- **Só no que não é óbvio.** Código que se lê sozinho não leva comentário —
  comentário demais é ruído, e ruído esconde o que importa. Na dúvida, apaga.
- **`/** */` é JSDoc: pertence a um export.** Dentro de função, comentário é
  `//` de uma ou duas linhas. Bloco de doc no meio de um corpo é o formato
  errado, e é o que faz o arquivo parecer documentado sem estar.
- **`@example` quando o uso não sai da assinatura.** `mergerUI(a, b)` precisa;
  `useProvide(value)` não.
- **Nunca dentro de `<template>`.** Se o template precisa de explicação, ela vai
  no JSDoc do componente, no `<script>`. Única exceção: diretiva de lint
  (`<!-- eslint-disable-next-line … -->`), que é código, não comentário.
- **JSDoc obrigatório** em todo arquivo de `src/runtime/utils/`,
  `src/runtime/composables/` e `src/runtime/components/**` — no export default e
  em cada export nomeado público.

```ts
/**
 * Resolve o `mask`: nome de preset ganha, o resto vai cru pro maska.
 *
 * @example resolveMask("brCpf", masks) // → { mask: "###.###.###-##" }
 * @example resolveMask("##/##", masks) // → "##/##"
 */
```

Numa `.vue`, o JSDoc do componente abre o `<script lang="ts">`, antes dos imports:

```vue
<script lang="ts">
    /**
     * Campo de texto. Aceita `mask` e os utils de label, erro e contador.
     *
     * @example <RText name="nome" label="Nome" mask="brCpf" />
     */
    import type { Element } from "#rform/types";
```

**Cuidado nos componentes:** `test/unit/theme.test.ts` tokeniza o arquivo `.vue`
inteiro, comentário incluído. Classe Tailwind literal (`rounded-xl`, `bg-primary`,
`text-white`) ou um `(--rf-…)` dentro de um comentário **quebra o teste de tema**.
Exemplo em componente mostra a tag, nunca a classe.
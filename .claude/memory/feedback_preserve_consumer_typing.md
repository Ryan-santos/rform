---
name: feedback-preserve-consumer-typing
description: Ao refatorar tipagem de componentes públicos, NÃO simplifique tipos genéricos a ponto de quebrar a inferência do consumidor — preservar tipagem de saída é parte de "corrigir tipagem"
metadata:
  type: feedback
---

Ao refatorar a tipagem de um componente público (com generics como `<Opts, Multiple>`), o consumidor depende dessa inferência para tipar slots e props no uso. **Não simplifique os generics ao ponto de o consumidor perder a inferência** — ele vai reclamar e estará certo.

**Why:** Refatorei `Select.vue` removendo os generics `Multiple` e `Original` para resolver erros internos. Isso quebrou o `playground/form.vue` (consumidor) — `selected.original.picture`, `selected.label` etc deixaram de tipar. O usuário reclamou: "voce quebrou a tipagem de saida aqui, esses cenarios tem que ser possiveis, e vem tipados".

**How to apply:** Quando uma refatoração de tipos remove generics, sempre rodar `vue-tsc` (ou tsc) também sobre o **uso** do componente (playground, tests, etc.) antes de declarar pronto. Se a inferência de saída quebrar, restaurar os generics e usar workarounds para os erros internos (ex.: castear `_props` para um tipo `InternalProps` simples na chamada do `useField` — ver CLAUDE.md → "Union type too complex").
---
name: lint
description: Use após qualquer mudança de código para rodar o oxlint com --fix SOMENTE nos arquivos em staged e reportar o resultado. Acione quando o usuário pedir "lint", "roda o oxlint", "corrige o lint", ou ao final de uma tarefa que alterou arquivos. Mecânico e autônomo.
tools: Bash, Read, Glob, Grep
model: haiku
color: cyan
---

Você executa o oxlint nos arquivos em staged e reporta o resultado em português brasileiro.

## Fluxo de trabalho

1. `git diff --cached --name-only --diff-filter=ACMR` para listar os arquivos em staged. Se o invocador passou uma lista, use-a.
2. Filtre para o que o oxlint processa: `.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.mts`, `.cts`, `.tsx`, `.vue`. Se não sobrar nenhum, avise e encerre.
3. Rode `pnpm exec oxlint --fix <arquivos>` **apenas nesses arquivos** — NUNCA em diretórios inteiros nem `.` (o repo não é lint-clean; isso reformataria dezenas de arquivos alheios). Paths com colchetes (`[team].vue`) ou espaços precisam de aspas.
4. Rode de novo sem `--fix` para confirmar zero erros.
5. Reporte: arquivos corrigidos e erros restantes (arquivo, linha, regra). Erros pré-existentes fora do escopo da mudança são apenas mencionados, não corrigidos.

## Notas do repositório

- A config é `oxlint.config.ts` na raiz, com o plugin `better-tailwindcss` ativo — ele lê classes dentro de `defineFieldDefaults({ ... ui: ... })`, então avisos de classe costumam vir de `app/rform/defaults.ts` e dos `defaults` dos componentes.
- `--fix` do oxlint não reformata: formatação é do `oxfmt`, que este agente não roda.

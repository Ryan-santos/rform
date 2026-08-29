# rform

Nuxt module that ships form components (`RForm`, `RText`, `RSelect`, `RArray`, etc.) built around an injection-based composition pattern.

## Arquitetura

### Padrão de componente

Todo componente em `src/runtime/components/*.vue` segue o mesmo formato:

1. **`<script lang="ts">`** — exporta `defaults` (via `defineDefaults`) e o tipo `Props`. O `Props` é montado a partir de `Element<typeof defaults>` (de `src/type.d.ts`) interseccionado com `Utils["..."]` (de `#rform/types/components/utils/props`) e props específicas.
2. **`<script setup lang="ts">`** — chama `await useInjection(_props)` para obter `{ id, model, props }`. Componentes container (Form, Array, Object) também chamam `useProvide({ id, model })`.
3. **`defaults`** sempre define `ui` (classes Tailwind) + `default` (valor inicial do model). Outros campos (`keyValue`, `keyLabel` no Select) também viram defaults mesclados via `merger`.

### useInjection (`src/runtime/composables/useInjection.ts`)

- Lê o pai (Form) via `inject(key)`. Quando há pai e `props.name` está definido, `model.value` lê/escreve diretamente em `upper.model.value[name]` — é por isso que mutações em arrays no model do filho refletem no Form.
- Mescla `defaults` + `appConfig` + `localProps` + `sourceProps` via `merger`.
- Carrega defaults dinamicamente via `import('../components/${componentName}.vue')` no final. O `componentName` é injetado pelo `src/vite.plugin.ts` em tempo de build.

### `Element<OBJ>` (`src/type.d.ts`)

- Tipa `modelValue`/`default` baseado em `OBJ["default"]` via `ConvertNeverToUnknown`.
- Atenção: se `defaults.default = null`, então `modelValue?: null` — props com valores diferentes precisam sobrescrever via `Omit<Element<...>, "modelValue" | "default"> & { modelValue?: unknown; default?: unknown }`.

## Gotchas

### Props genéricos booleanos: use `T & boolean`

Vue compila `defineProps<{ multiple?: Multiple }>()` (onde `Multiple extends boolean`) com `multiple: { type: null }` em runtime. Sem `type: Boolean`, `<RSelect multiple>` chega como `""` (string vazia, falsy). **Solução:** declarar como `multiple?: Multiple & boolean` — a interseção força o compilador SFC a emitir `type: Boolean` mantendo o generic para inferência de tipos do slot.

Confirmação: olhar o bundle servido pelo dev server (`curl /_nuxt/@fs/.../Select.vue | grep "multiple:"`).

### "Union type too complex" em useInjection

Generics com conditional types nas `Props` (ex.: `Multiple extends true ? T[] : T` no slot) cascateiam complexidade quando passados para `useInjection<T extends Element>`. **Solução:** declarar um tipo `InternalProps` simples (sem generics) e castear na chamada — `await useInjection(_props as unknown as InternalProps)`. Mantém o tipo público rico sem estourar o type-checker.

Quando o slot precisa expor um tipo conditional (`Multiple extends true ? Item[] : Item`), criar helpers em script (`fieldSlot()`, `rowSlot(option)`) que retornam `as Selected` — o template não suporta cast `as` direto em expressões.

### vue-tsc precisa de `.nuxt`

`tsconfig.json` só referencia `.nuxt/tsconfig.*.json`. Sem rodar `nuxi prepare` (ou o `dev`) primeiro, `vue-tsc -p .nuxt/tsconfig.app.json --noEmit` falha. Para checagem rápida:

```
npx vue-tsc -p .nuxt/tsconfig.app.json --noEmit 2>&1 | Select-String "Select.vue"
```

## Convenções de código (oxfmt.config.ts)

- 4 espaços, aspas duplas, semicolons, `trailingComma: "none"`, `singleAttributePerLine: true`, `vueIndentScriptAndStyle: true`.
- Sem `insertFinalNewline`.

## Comandos úteis

- `cd playground && npm run dev` — sobe o playground (porta 3000) com o módulo em watch.
- `npx oxlint <arquivo>` — lint (config em `oxlint.config.ts`, plugin tailwind ativo).
- `npx vue-tsc -p .nuxt/tsconfig.app.json --noEmit` — type-check (precisa de `.nuxt` populado).

## Playground

`playground/app/pages/form.vue` é o smoke test visual de todos os componentes. Cenários do `RSelect` cobrem: array primitivo, multi+modelFull, single+modelFull com slot custom, e objeto `{key: label}`. Útil para validar mudanças que afetem inferência de tipos do slot.
